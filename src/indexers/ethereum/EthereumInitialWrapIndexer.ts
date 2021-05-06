import {Logger} from "tslog";
import {StatisticsDependencies} from "../StatisticsDependencies";
import {Knex} from "knex";
import {AppState} from "../state/AppState";
import {EthereumConfig} from "../../configuration";
import {ethers} from "ethers";
import {id} from "ethers/lib/utils";
import {EthereumLock} from "../../domain/events/EthereumLock";
import {EthereumLockRepository} from "../../repositories/EthereumLockRepository";
import tokenList from "../../domain/TokenList";
import {Token} from "../../domain/Token";
import {BigNumber} from "bignumber.js";

export class EthereumInitialWrapIndexer {

  private readonly _logger: Logger;
  private readonly _dbClient: Knex;
  private _appState: AppState;
  private _ethereumConfig: EthereumConfig;
  private _ethereumProvider: ethers.providers.Provider;
  private _ethereumLockRepository: EthereumLockRepository;

  private static readonly _wrapTopics: string[] = [
    id('ERC20WrapAsked(address,address,uint256,string)'),
    id('ERC721WrapAsked(address,address,uint256,string)'),
  ];

  private static readonly _wrapInterface: ethers.utils.Interface = new ethers.utils.Interface(
    [
      'event ERC20WrapAsked(address user, address token, uint256 amount, string tezosDestinationAddress)',
      'event ERC721WrapAsked(address user, address token, uint256 tokenId, string tezosDestinationAddress)',
    ]
  );

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._ethereumConfig = dependencies.ethereumConfiguration;
    this._dbClient = dependencies.dbClient;
    this._appState = new AppState(this._dbClient);
    this._ethereumProvider = dependencies.ethereumProvider;
    this._ethereumLockRepository = new EthereumLockRepository(dependencies.dbClient);
  }

  async index(): Promise<void> {
    let transaction;
    try {
      const firstBlockNumber = await this.getFirstBlockToIndex();
      const lastBlockNumber = await this.getLastBlockToIndex(firstBlockNumber);
      this._logger.debug("Indexing ethereum wraps => " + firstBlockNumber + ":" + lastBlockNumber);

      const rawLogs = await this._getLogs(firstBlockNumber + 1, lastBlockNumber);
      this._logger.debug(`${rawLogs.length} wrap events to index`);

      transaction = await this._dbClient.transaction();
      if (rawLogs.length > 0) {
        await this._addEvents(rawLogs, transaction);
      }
      await this._setLastIndexedBlock(lastBlockNumber + 1, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process wrap events ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  async _setLastIndexedBlock(lastBlockNumber: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setEthereumWrapLastIndexedBlockNumber(lastBlockNumber, transaction);
    const block = await this._ethereumProvider.getBlock(lastBlockNumber);
    await this._appState.setEthereumWrapLastIndexedBlockTimestamp(block.timestamp, transaction);
  }

  async getFirstBlockToIndex(): Promise<number> {
    return await this._appState.getEthereumWrapLastIndexedBlockNumber() ?? this._ethereumConfig.firstBlockToIndex;
  }

  async getLastBlockToIndex(firstBlockNumber: number): Promise<number> {
    const currentBlockNumber = await this._ethereumProvider.getBlockNumber();
    return currentBlockNumber - firstBlockNumber > (2500 + this._ethereumConfig.confirmationsThreshold) ? firstBlockNumber + 2500 : currentBlockNumber - this._ethereumConfig.confirmationsThreshold;
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
      topics: [EthereumInitialWrapIndexer._wrapTopics],
    };
  }

  private async _addEvents(
    rawLogs: ethers.providers.Log[],
    transaction: Knex.Transaction
  ) {

    const ethereumLocks = [];
    await Promise.all(rawLogs.map(async (log) => {
      const transactionData = await this._ethereumProvider.getTransaction(log.transactionHash);
      const receipt = await this._ethereumProvider.getTransactionReceipt(log.transactionHash);
      const block = await this._ethereumProvider.getBlock(transactionData.blockHash);
      const logDescription = EthereumInitialWrapIndexer._parseERCLog(log);

      if (log && logDescription && transactionData && receipt && block) {
        ethereumLocks.push(EthereumInitialWrapIndexer.getEthereumLock(log, logDescription, transactionData, receipt, block));
      }
    }));

    for (const ethereumLock of ethereumLocks) {
      if (ethereumLock) {
        const exist = await this._ethereumLockRepository.isExist(ethereumLock, transaction);

        if (!exist) {
          await this._ethereumLockRepository.save(ethereumLock, transaction);
        }
      }
    }
  }

  private static _parseERCLog(log: ethers.providers.Log): ethers.utils.LogDescription {
    return EthereumInitialWrapIndexer._wrapInterface.parseLog(log);
  }

  private static getEthereumLock(log: ethers.providers.Log, logDescription: ethers.utils.LogDescription, transactionData: ethers.providers.TransactionResponse, receipt: ethers.providers.TransactionReceipt, block: ethers.providers.Block): EthereumLock | null {

    const benderToken = EthereumInitialWrapIndexer._getBenderToken(logDescription.args['token'].toLowerCase());

    if (logDescription.name === 'ERC20WrapAsked') {
      return {
        id: `${log.blockHash}:${log.logIndex}`,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        type: 'ERC20',
        token: logDescription.args['token'].toLowerCase(),
        amount: new BigNumber(logDescription.args['amount'].toString()).shiftedBy(-benderToken.decimals).toNumber(),
        ethereumSymbol: benderToken.ethereumSymbol,
        ethereumFrom: logDescription.args['user'].toLowerCase(),
        ethereumTransactionHash: log.transactionHash,
        ethereumBlockHash: log.blockHash,
        ethereumBlock: log.blockNumber,
        ethereumTransactionFee: receipt.gasUsed.mul(transactionData.gasPrice).toString(),
        ethereumTimestamp: new Date(block.timestamp * 1000).getTime(),
        tezosTo: logDescription.args['tezosDestinationAddress']
      };
    } else if (logDescription.name === 'ERC721WrapAsked') {
      return {
        id: `${log.blockHash}:${log.logIndex}`,
        createdAt: new Date().getTime(),
        updatedAt: new Date().getTime(),
        type: 'ERC721',
        token: logDescription.args['token'].toLowerCase(),
        tokenId: logDescription.args['tokenId'].toString(),
        ethereumSymbol: benderToken.ethereumSymbol,
        ethereumFrom: logDescription.args['user'].toLowerCase(),
        ethereumTransactionHash: log.transactionHash,
        ethereumBlockHash: log.blockHash,
        ethereumBlock: log.blockNumber,
        ethereumTransactionFee: receipt.gasUsed.mul(transactionData.gasPrice).toString(),
        ethereumTimestamp: new Date(block.timestamp * 1000).getTime(),
        tezosTo: logDescription.args['tezosDestinationAddress']
      };
    }
    return null;
  }

  private static _getBenderToken(token: string): Token {
    return tokenList.find((elt) => elt.token.toLowerCase() === token.toLowerCase());
  }
}
