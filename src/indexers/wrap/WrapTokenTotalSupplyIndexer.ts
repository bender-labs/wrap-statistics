import {Logger} from 'tslog';
import {Knex} from 'knex';
import {StatisticsDependencies} from "../StatisticsDependencies";
import {TezosConfig} from "../../configuration";
import {TezosToolkit} from "@taquito/taquito";
import BigNumber from "bignumber.js";
import {DateTime} from "luxon";
import {AppStateRepository} from "../../repositories/AppStateRepository";
import {Schema} from "@taquito/michelson-encoder";
import {ScriptResponse} from "@taquito/rpc";
import {WrapTokenTotalSupplyRepository} from "../../repositories/WrapTokenTotalSupplyRepository";
import tokenList from "../../domain/TokenList";

export class WrapTokenTotalSupplyIndexer {

  constructor({logger, tezosConfiguration, tezosToolkit, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._appState = new AppStateRepository(dbClient);
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._wrapTotalSupplyRepository = new WrapTokenTotalSupplyRepository(dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing Wrap token total supply`);
    let nextLevel = await this._getLastIndexedLevel() + 100;
    const currentBlock = await this._tezosToolkit.rpc.getBlockHeader();
    if (currentBlock.level < nextLevel) {
      return;
    }
    while (nextLevel <= currentBlock.level) {
      this._logger.debug(`Indexing Wrap token total supply for level ${nextLevel}`)
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        const block = await this._tezosToolkit.rpc.getBlock({block: nextLevel.toString()});
        const blockDate = DateTime.fromISO(block.header.timestamp.toString());
        const supply = await this._getWrapTotalSupply(nextLevel);
        await this._wrapTotalSupplyRepository.save({
          timestamp: blockDate.toMillis(),
          level: nextLevel,
          value: supply
        }, transaction);
        await this._appState.setLastWrapTokenTotalSupplyIndexedLevel(nextLevel, transaction);
        await transaction.commit();
        nextLevel += 100;
      } catch (e) {
        this._logger.error(`Cant get wrap token total supply : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
        return;
      }
    }
  }

  private async _getWrapTotalSupply(level: number): Promise<string> {
    const wrapToken = tokenList.find(t => t.tezosSymbol === "WRAP");
    const storage = await this._tezosToolkit.rpc.getStorage(wrapToken.tezosContract, {block: level.toString()});
    const schema = await this._tezosToolkit.rpc.getScript(wrapToken.tezosContract, {block: level.toString()});
    let contractSchema: Schema;
    if (Schema.isSchema(schema)) {
      contractSchema = schema;
    } else {
      contractSchema = Schema.fromRPCResponse({script: schema as ScriptResponse});
    }
    const result = contractSchema.Execute(storage);
    const supply = result['assets']['total_supply'] as BigNumber;
    return supply.shiftedBy(-wrapToken.decimals).toString(10);
  }

  private async _getLastIndexedLevel(): Promise<number> {
    const result = await this._appState.getLastWrapTokenTotalSupplyIndexedLevel();
    return result ? result : this._tezosConfiguration.quipuswapWrapXtzFirstBlockToIndex - 100;
  }

  private _logger: Logger;
  private readonly _dbClient: Knex;
  private _appState: AppStateRepository;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
  private _wrapTotalSupplyRepository: WrapTokenTotalSupplyRepository;

}
