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
import {WrapXtzPriceRepository} from "../../repositories/WrapXtzPriceRepository";

export class WrapXtzPriceIndexer {

  constructor({logger, tezosConfiguration, tezosToolkit, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._appState = new AppStateRepository(dbClient);
    this._tezosConfiguration = tezosConfiguration;
    this._tezosToolkit = tezosToolkit;
    this._wrapPriceRepository = new WrapXtzPriceRepository(dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing Wrap price`);
    let nextLevel = await this._getLastIndexedLevel() + 10;
    const currentBlock = await this._tezosToolkit.rpc.getBlockHeader();
    if (currentBlock.level < nextLevel) {
      return;
    }
    while (nextLevel <= currentBlock.level) {
      this._logger.debug(`Indexing Wrap price for level ${nextLevel}`)
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        const block = await this._tezosToolkit.rpc.getBlock({block: nextLevel.toString()});
        const blockDate = DateTime.fromISO(block.header.timestamp.toString());
        const valueInTez = await this._getWrapValueInTez(nextLevel);
        await this._wrapPriceRepository.save({
          timestamp: blockDate.toMillis(),
          level: nextLevel,
          value: valueInTez
        }, transaction);
        await this._appState.setLastQuipuswapIndexedLevel(nextLevel, transaction);
        await transaction.commit();
        nextLevel += 10;
      } catch (e) {
        this._logger.error(`Cant get wrap price : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
        return;
      }
    }
  }

  private async _getWrapValueInTez(level: number): Promise<string> {
    const storage = await this._tezosToolkit.rpc.getStorage(this._tezosConfiguration.quipuswapWrapXtzContractAddress, {block: level.toString()});
    const schema = await this._tezosToolkit.rpc.getScript(this._tezosConfiguration.quipuswapWrapXtzContractAddress, {block: level.toString()});
    let contractSchema: Schema;
    if (Schema.isSchema(schema)) {
      contractSchema = schema;
    } else {
      contractSchema = Schema.fromRPCResponse({script: schema as ScriptResponse});
    }
    const result = contractSchema.Execute(storage);
    return this._extractWrapValueInTez(
      result['storage']['tez_pool'] as BigNumber,
      result['storage']['token_pool'] as BigNumber,
    );
  }

  private _extractWrapValueInTez(tez: BigNumber, wrap: BigNumber): string {
    const tezPool = tez.dividedBy(1000000);
    const wrapPool = wrap.dividedBy(10.0 ** 8);
    const ratio = tezPool.dividedBy(wrapPool);
    return ratio.decimalPlaces(6).toString(10);
  }

  private async _getLastIndexedLevel(): Promise<number> {
    const result = await this._appState.getLastQuipuswapIndexedLevel();
    return result ? result : this._tezosConfiguration.quipuswapWrapXtzFirstBlockToIndex;
  }

  private _logger: Logger;
  private readonly _dbClient: Knex;
  private _appState: AppStateRepository;
  private _tezosConfiguration: TezosConfig;
  private _tezosToolkit: TezosToolkit;
  private _wrapPriceRepository: WrapXtzPriceRepository;

}
