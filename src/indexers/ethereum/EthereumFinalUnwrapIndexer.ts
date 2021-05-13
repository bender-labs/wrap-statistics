import {StatisticsDependencies} from "../StatisticsDependencies";
import {AppState} from "../state/AppState";
import {EthereumUnlockRepository} from "../../repositories/EthereumUnlockRepository";
import {Logger} from "tslog";
import {Knex} from "knex";
import {EthereumConfig} from "../../configuration";
import {ethers} from "ethers";
import {id} from "ethers/lib/utils";
import {Token} from "../../domain/Token";
import tokenList from "../../domain/TokenList";
import {EthereumUnlock} from "../../domain/events/EthereumUnlock";
import {BigNumber} from "bignumber.js";

export class EthereumFinalUnwrapIndexer {

  private readonly _logger: Logger;
  private readonly _dbClient: Knex;
  private _appState: AppState;
  private _ethereumConfig: EthereumConfig;
  private _ethereumProvider: ethers.providers.Provider;
  private _ethereumUnlockRepository: EthereumUnlockRepository;

  private static readonly _topics: string[] = [
    id("ExecutionSuccess(bytes32)"),
    id("ExecutionFailure(bytes32)")
  ];

  private static readonly _unlockInterface: ethers.utils.Interface = new ethers.utils.Interface(
    [
      "function execTransaction(address to,uint256 value,bytes calldata data,string calldata tezosOperation,bytes calldata signatures) external returns (bool success)",
      "function transfer(address recipient, uint256 amount) public virtual override returns (bool)",
      "event ExecutionFailure(bytes32 txHash)",
      "event ExecutionSuccess(bytes32 txHash)"
    ]
  );

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._ethereumConfig = dependencies.ethereumConfiguration;
    this._dbClient = dependencies.dbClient;
    this._appState = new AppState(this._dbClient);
    this._ethereumProvider = dependencies.ethereumProvider;
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dependencies.dbClient);
  }

  async index(): Promise<void> {
    let transaction;
    try {
      const firstBlockNumber = await this.getFirstBlockToIndex();
      const lastBlockNumber = await this.getLastBlockToIndex(firstBlockNumber);
      this._logger.debug("Indexing ethereum unwraps => " + firstBlockNumber + ":" + lastBlockNumber);

      const rawLogs = await this._getLogs(firstBlockNumber + 1, lastBlockNumber);
      this._logger.debug(`${rawLogs.length} unwrap events to index`);

      transaction = await this._dbClient.transaction();
      if (rawLogs.length > 0) {
        await this._addEvents(rawLogs, transaction);
      }
      await this._setLastIndexedBlock(lastBlockNumber, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process unwrap events ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  async getFirstBlockToIndex(): Promise<number> {
    return await this._appState.getEthereumUnwrapLastIndexedBlockNumber() ?? this._ethereumConfig.firstBlockToIndex;
  }

  async getLastBlockToIndex(firstBlockNumber: number): Promise<number> {
    const currentBlockNumber = await this._ethereumProvider.getBlockNumber();
    return currentBlockNumber - firstBlockNumber > (2500 + this._ethereumConfig.confirmationsThreshold) ? firstBlockNumber + 2500 : currentBlockNumber - this._ethereumConfig.confirmationsThreshold;
  }

  async _setLastIndexedBlock(lastBlockNumber: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setEthereumUnwrapLastIndexedBlockNumber(lastBlockNumber, transaction);
    const block = await this._ethereumProvider.getBlock(lastBlockNumber);
    await this._appState.setEthereumUnwrapLastIndexedBlockTimestamp(block.timestamp, transaction);
  }

  private async _getLogs(fromBlock: number, toBlock: number): Promise<ethers.providers.Log[]> {
    const filter = this._buildFilters(fromBlock, toBlock);
    return this._ethereumProvider.getLogs(filter);
  }

  private _buildFilters(fromBlock: number, toBlock: number): ethers.providers.Filter {
    return {
      address: this._ethereumConfig.wrapContractAddress,
      fromBlock: fromBlock,
      toBlock: toBlock,
      topics: [EthereumFinalUnwrapIndexer._topics],
    };
  }

  private async _addEvents(
    rawLogs: ethers.providers.Log[],
    transaction: Knex.Transaction
  ) {
    const ethereumUnlocks = [];
    await Promise.all(rawLogs.map(async (log) => {
      const logDescription = EthereumFinalUnwrapIndexer._parseERCLog(log);
      const transactionData = await this._ethereumProvider.getTransaction(log.transactionHash);
      const block = await this._ethereumProvider.getBlock(transactionData.blockHash);
      const decodedCallData = EthereumFinalUnwrapIndexer._unlockInterface.decodeFunctionData("execTransaction", transactionData["data"]);
      const benderToken = EthereumFinalUnwrapIndexer._getBenderToken(decodedCallData["to"].toLowerCase());
      const decodedTransferData = EthereumFinalUnwrapIndexer._unlockInterface.decodeFunctionData("transfer", decodedCallData["data"]);
      const receipt = await this._ethereumProvider.getTransactionReceipt(log.transactionHash);

      if (logDescription && decodedCallData && decodedTransferData && receipt && block && transactionData && benderToken) {
        const ethereumUnlock = EthereumFinalUnwrapIndexer._buildEthereumUnlock(logDescription, decodedCallData, decodedTransferData, receipt, block, transactionData, benderToken);
        ethereumUnlocks.push(ethereumUnlock);
      }
    }));

    for (const ethereumLock of ethereumUnlocks) {
      if (ethereumLock) {
        const exist = await this._ethereumUnlockRepository.isExist(ethereumLock, transaction);

        if (!exist) {
          await this._ethereumUnlockRepository.save(ethereumLock, transaction);
        }
      }
    }
  }

  private static _parseERCLog(log: ethers.providers.Log): ethers.utils.LogDescription {
    return EthereumFinalUnwrapIndexer._unlockInterface.parseLog(log);
  }

  private static _buildEthereumUnlock(logDescription: ethers.utils.LogDescription,
                                      decodedCallData: ethers.utils.Result,
                                      decodedTransferData: ethers.utils.Result,
                                      receipt: ethers.providers.TransactionReceipt,
                                      block: ethers.providers.Block,
                                      transactionData: ethers.providers.TransactionResponse,
                                      benderToken: Token): EthereumUnlock {

    return {
      id: decodedCallData["tezosOperation"],
      createdAt: new Date().getTime(),
      updatedAt: new Date().getTime(),
      type: 'ERC20',
      token: benderToken['token'].toLowerCase(),
      amount: new BigNumber(decodedTransferData["amount"].toString()).shiftedBy(-benderToken.decimals).toNumber(),
      ethereumSymbol: benderToken.ethereumSymbol,
      ethereumTo: decodedTransferData["recipient"].toLowerCase(),
      ethereumTransactionHash: transactionData["hash"],
      ethereumBlockHash: transactionData["blockHash"],
      ethereumBlock: transactionData["blockNumber"],
      ethereumTransactionFee: receipt.gasUsed.mul(transactionData.gasPrice).toString(),
      ethereumTimestamp: new Date(block.timestamp * 1000).getTime(),
      tezosFrom: "",
      tezosOperationHash: "",
      success: logDescription.name === 'ExecutionSuccess'
    };
  }

  private static _getBenderToken(token: string): Token {
    return tokenList.find((elt) => elt.token.toLowerCase() === token.toLowerCase());
  }
}
