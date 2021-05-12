import {StatisticsDependencies} from "./StatisticsDependencies";
import {Logger} from "tslog";
import tokenList from "../domain/TokenList";
import {EthereumLockRepository} from "../repositories/EthereumLockRepository";
import {EthereumUnlockRepository} from "../repositories/EthereumUnlockRepository";
import BigNumber from "bignumber.js";
import {AppStateRepository} from "../repositories/AppStateRepository";
import {Knex} from "knex";
import {BenderTime} from "../domain/BenderTime";
import {DateTime} from "luxon";
import {TvlRepository} from "../repositories/TvlRepository";

export class TotalValueLockedIndexer {

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._appState = new AppStateRepository(dependencies.dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dependencies.dbClient);
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dependencies.dbClient);
    this._dbClient = dependencies.dbClient;
    this._tvlRepository = new TvlRepository(dependencies.dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug("Indexing tvl for all assets");
    const nowMs = DateTime.now().toMillis();
    const lastWrapTimestamp = await this._getLastWrapIndexedTimestamp() ?? 0;
    const lastUnwrapTimestamp = await this._getLastUnwrapIndexedTimestamp() ?? 0;

    let currentIndexingTimeMs = DateTime.fromMillis(await this._getLastTvlIndexingTimestamp()).plus({"hours": 1}).toMillis();

    while (currentIndexingTimeMs < nowMs && currentIndexingTimeMs < (lastWrapTimestamp * 1000) && currentIndexingTimeMs < (lastUnwrapTimestamp * 1000)) {
      let transaction;
      try {
        this._logger.debug("Tvl values @ " + DateTime.fromMillis(currentIndexingTimeMs).toString());
        transaction = await this._dbClient.transaction();

        for (const token of tokenList) {
          const lockAmount = new BigNumber(await this._ethereumLockRepository.sumToken(token, currentIndexingTimeMs));
          const unlockAmount = new BigNumber(await this._ethereumUnlockRepository.sumToken(token, currentIndexingTimeMs));
          const totalValueLocked = lockAmount.minus(unlockAmount);

          await this._tvlRepository.save({
            asset: token.ethereumSymbol,
            value: totalValueLocked.toString(),
            timestamp: currentIndexingTimeMs
          }, transaction);
          this._logger.debug(token.ethereumSymbol + " tvl => " + totalValueLocked.toString());
        }

        await this._setLastTvlIndexingTimestamp(currentIndexingTimeMs, transaction);
        currentIndexingTimeMs = DateTime.fromMillis(currentIndexingTimeMs).plus({"hours": 1}).toMillis();
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Error building tvl values : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  async _getLastWrapIndexedTimestamp(): Promise<number> {
    return await this._appState.getEthereumWrapLastIndexedBlockTimestamp();
  }

  async _getLastUnwrapIndexedTimestamp(): Promise<number> {
    return await this._appState.getEthereumUnwrapLastIndexedBlockTimestamp();
  }

  async _setLastTvlIndexingTimestamp(lastTvlIndexingTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setLastTvlIndexingTimestamp(lastTvlIndexingTimestamp, transaction);
  }

  async _getLastTvlIndexingTimestamp(): Promise<number> {
    return await this._appState.getLastTvlIndexingTimestamp() ?? BenderTime.startMs;
  }

  private _logger: Logger;
  private _appState: AppStateRepository;
  private _ethereumLockRepository: EthereumLockRepository;
  private _ethereumUnlockRepository: EthereumUnlockRepository;
  private _dbClient: Knex;
  private _tvlRepository: TvlRepository;

}
