import {StatisticsDependencies} from "../indexers/StatisticsDependencies";
import {Logger} from "tslog";
import tokenList from "../domain/TokenList";
import {EthereumLockRepository, LockAggregatedResult} from "../repositories/EthereumLockRepository";
import {EthereumUnlockRepository, UnlockAggregatedResult} from "../repositories/EthereumUnlockRepository";
import BigNumber from "bignumber.js";
import {AppStateRepository} from "../repositories/AppStateRepository";
import {Knex} from "knex";
import {BenderTime} from "../domain/BenderTime";
import {DateTime} from "luxon";
import {ProjectionTotalValueLockedRepository} from "../repositories/ProjectionTotalValueLockedRepository";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import {Token} from "../domain/Token";
import {NotionalUsd} from "../domain/NotionalUsd";

export class TotalValueLockedBuilder {

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._appStateRepository = new AppStateRepository(dependencies.dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dependencies.dbClient);
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dependencies.dbClient);
    this._dbClient = dependencies.dbClient;
    this._tvlRepository = new ProjectionTotalValueLockedRepository(dependencies.dbClient);
    this._notionalRepository = new NotionalUsdRepository(dependencies.dbClient);
    this._benderTime = new BenderTime();
  }

  async build(): Promise<void> {
    this._logger.debug("Building tvl for all assets");
    const nowMs = DateTime.now().toMillis();

    const globalIndexingTimestamp = await this._appStateRepository.getGlobalIndexingTimestamp();
    let currentIndexingTimeMs = DateTime.fromMillis(await this._getLastTvlIndexingTimestamp()).plus({"hours": 1}).toMillis();

    while (currentIndexingTimeMs < nowMs && currentIndexingTimeMs < globalIndexingTimestamp) {
      let transaction;
      try {
        this._logger.debug("Tvl values @ " + DateTime.fromMillis(currentIndexingTimeMs).toString());
        transaction = await this._dbClient.transaction();

        const locks = await this._ethereumLockRepository.sumAll(currentIndexingTimeMs);
        const unlocks = await this._ethereumUnlockRepository.sumAll(currentIndexingTimeMs);
        const endOfIntervalNotionalValues = await this._notionalRepository.findAll(currentIndexingTimeMs);

        for (const token of tokenList.filter(t => t.type === "ERC20")) {
          const tokenTotalValueLocked = this._getTokenTotalLockedVolume(token, locks, unlocks);
          const tokenUsdTotalValueLocked = this._getTokenUsdTotalLockedVolume(token, tokenTotalValueLocked, endOfIntervalNotionalValues);

          await this._tvlRepository.save({
            asset: token.ethereumSymbol,
            amount: tokenTotalValueLocked.toString(10),
            usd_value: tokenUsdTotalValueLocked.toString(10),
            timestamp: currentIndexingTimeMs
          }, transaction);
          this._logger.debug(token.ethereumSymbol + " tvl => " + tokenUsdTotalValueLocked.toString());
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

  private async _setLastTvlIndexingTimestamp(lastTvlIndexingTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appStateRepository.setLastTvlIndexingTimestamp(lastTvlIndexingTimestamp, transaction);
  }

  private async _getLastTvlIndexingTimestamp(): Promise<number> {
    return await this._appStateRepository.getLastTvlIndexingTimestamp() ?? BenderTime.startMs;
  }

  private _getTokenTotalLockedVolume(token: Token, locks: LockAggregatedResult[], unlocks: UnlockAggregatedResult[]): BigNumber {
    const tokenLocks = locks.find(s => s.ethereumSymbol === token.ethereumSymbol) ? locks.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
    const tokenUnlocks = unlocks.find(s => s.ethereumSymbol === token.ethereumSymbol) ? unlocks.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
    return new BigNumber(tokenLocks).minus(tokenUnlocks);
  }

  private _getTokenUsdTotalLockedVolume(token: Token, tokenUsdWrapVolume: BigNumber, endOfIntervalNotionalValues: NotionalUsd[]): BigNumber {
    const endOfIntervalTokenNotionalValue = endOfIntervalNotionalValues.find(v => v.asset === token.ethereumSymbol);
    return endOfIntervalTokenNotionalValue ? new BigNumber(endOfIntervalTokenNotionalValue.value).multipliedBy(tokenUsdWrapVolume) : new BigNumber(0);
  }

  private _logger: Logger;
  private _appStateRepository: AppStateRepository;
  private _ethereumLockRepository: EthereumLockRepository;
  private _ethereumUnlockRepository: EthereumUnlockRepository;
  private _dbClient: Knex;
  private _tvlRepository: ProjectionTotalValueLockedRepository;
  private _notionalRepository: NotionalUsdRepository;
  private _benderTime: BenderTime;

}
