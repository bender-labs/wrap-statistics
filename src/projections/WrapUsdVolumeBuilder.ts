import {Logger} from "tslog";
import {Knex} from "knex";
import {AppStateRepository} from "../repositories/AppStateRepository";
import {StatisticsDependencies} from "../indexers/StatisticsDependencies";
import {BenderTime} from "../domain/BenderTime";
import {DateTime} from "luxon";
import {ProjectionWrapVolumeRepository} from "../repositories/ProjectionWrapVolumeRepository";
import {ProjectionRollingWrapVolumeRepository} from "../repositories/ProjectionRollingWrapVolumeRepository";
import {EthereumLockRepository, LockAggregatedResult} from "../repositories/EthereumLockRepository";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import tokenList from "../domain/TokenList";
import BigNumber from "bignumber.js";
import {Token} from "../domain/Token";
import {NotionalUsd} from "../domain/NotionalUsd";

export class WrapUsdVolumeBuilder {

  constructor({logger, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._appStateRepository = new AppStateRepository(dbClient);
    this._benderTime = new BenderTime();
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._wrapUsdVolumeRepository = new ProjectionWrapVolumeRepository(dbClient);
    this._rollingWrapUsdVolumeRepository = new ProjectionRollingWrapVolumeRepository(dbClient);
  }

  async build(): Promise<void> {
    this._logger.debug("building wrap usd volumes");
    const nowMs = DateTime.utc().toMillis();

    const lastWrapTimestamp = await this._getLastWrapIndexedTimestamp() ?? 0;
    const lastUnwrapTimestamp = await this._getLastUnwrapIndexedTimestamp() ?? 0;
    const lastNotionalTimestamp = await this._getLastNotionalIndexingTimestamp() ?? 0;

    let currentIndexingTimeMs = await this._getLastWrappingUsdVolumeBuildTimestamp();

    while (currentIndexingTimeMs < nowMs && currentIndexingTimeMs < (lastWrapTimestamp * 1000) && currentIndexingTimeMs < (lastUnwrapTimestamp * 1000) && currentIndexingTimeMs < lastNotionalTimestamp) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        this._logger.debug("building wrap usd volumes @ " + currentIndexingTimeMs);
        await this._buildRollingVolume(currentIndexingTimeMs, transaction);
        await this._buildDayWrapUsdVolumeFor(currentIndexingTimeMs, transaction);
        await this._buildWeekWrapUsdVolumeFor(currentIndexingTimeMs, transaction);
        await this._setLastWrappingUsdVolumeBuildTimestamp(currentIndexingTimeMs, transaction);
        await transaction.commit();
        currentIndexingTimeMs = DateTime.fromMillis(currentIndexingTimeMs).plus({"hours": 1}).toMillis();
      } catch (e) {
        this._logger.error(`Error building wrap usd volume : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getLastNotionalIndexingTimestamp(): Promise<number> {
    return await this._appStateRepository.getLastNotionalIndexingTimestamp();
  }

  private async _getLastWrapIndexedTimestamp(): Promise<number> {
    return await this._appStateRepository.getEthereumWrapLastIndexedBlockTimestamp();
  }

  private async _getLastUnwrapIndexedTimestamp(): Promise<number> {
    return await this._appStateRepository.getEthereumUnwrapLastIndexedBlockTimestamp();
  }

  private async _buildRollingVolume(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    const startTime = DateTime.fromMillis(currentIndexingTimeMs, {zone: "utc"}).minus({"days": 1});
    const startWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAll(startTime.toMillis());
    const endWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAll(currentIndexingTimeMs);
    const endOfIntervalNotionalValues = await this._notionalRepository.findAll(currentIndexingTimeMs);

    for (const token of tokenList) {
      const tokenWrapVolume = this._getTokenWrapVolume(token, startWrappingVolumeForAllTokens, endWrappingVolumeForAllTokens);
      const tokenUsdWrapVolume = this._getTokenUsdWrapVolume(token, tokenWrapVolume, endOfIntervalNotionalValues);

      await this._rollingWrapUsdVolumeRepository.save({
        name: "24h",
        asset: token.ethereumSymbol,
        amount: tokenWrapVolume.toString(10),
        usd_value: tokenUsdWrapVolume.toString(10)
      }, transaction);
    }
  }

  private async _buildDayWrapUsdVolumeFor(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    const currentDayInterval = this._benderTime.getBenderDayFor(currentIndexingTimeMs);
    await this._buildWrapUsdVolumeForInterval(currentDayInterval.start.toMillis(), currentDayInterval.end.toMillis(), transaction);
  }

  private async _buildWeekWrapUsdVolumeFor(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    const currentWeekInterval = this._benderTime.getBenderWeekFor(currentIndexingTimeMs);
    await this._buildWrapUsdVolumeForInterval(currentWeekInterval.start.toMillis(), currentWeekInterval.end.toMillis(), transaction);
  }

  private async _buildWrapUsdVolumeForInterval(start: number, end: number, transaction: Knex.Transaction): Promise<void> {
    const startWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAll(start);
    const endWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAll(end);
    const endOfIntervalNotionalValues = await this._notionalRepository.findAll(end);

    for (const token of tokenList) {
      const tokenWrapVolume = this._getTokenWrapVolume(token, startWrappingVolumeForAllTokens, endWrappingVolumeForAllTokens);
      const tokenUsdWrapVolume = this._getTokenUsdWrapVolume(token, tokenWrapVolume, endOfIntervalNotionalValues);

      await this._wrapUsdVolumeRepository.save({
        start: start,
        end: end,
        asset: token.ethereumSymbol,
        amount: tokenWrapVolume.toString(10),
        usd_value: tokenUsdWrapVolume.toString(10)
      }, transaction);
    }
  }

  private _getTokenWrapVolume(token: Token, startWrappingVolumeForAllTokens: LockAggregatedResult[], endWrappingVolumeForAllTokens: LockAggregatedResult[]): BigNumber {
    const startTokenWrappingVolume = startWrappingVolumeForAllTokens.find(s => s.ethereumSymbol === token.ethereumSymbol) ? startWrappingVolumeForAllTokens.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
    const endTokenWrappingVolume = endWrappingVolumeForAllTokens.find(s => s.ethereumSymbol === token.ethereumSymbol) ? endWrappingVolumeForAllTokens.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
    return new BigNumber(endTokenWrappingVolume).minus(startTokenWrappingVolume);
  }

  private _getTokenUsdWrapVolume(token: Token, tokenUsdWrapVolume: BigNumber, endOfIntervalNotionalValues: NotionalUsd[]): BigNumber {
    const endOfIntervalTokenNotionalValue = endOfIntervalNotionalValues.find(v => v.asset === token.ethereumSymbol);
    return endOfIntervalTokenNotionalValue ? new BigNumber(endOfIntervalTokenNotionalValue.value).multipliedBy(tokenUsdWrapVolume) : new BigNumber(0);
  }

  private async _setLastWrappingUsdVolumeBuildTimestamp(lastTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appStateRepository.setLastWrappingUsdVolumeBuildTimestamp(lastTimestamp, transaction);
  }

  private async _getLastWrappingUsdVolumeBuildTimestamp(): Promise<number> {
    return await this._appStateRepository.getLastWrappingUsdVolumeBuildTimestamp() ?? BenderTime.startMs;
  }

  private _logger: Logger;
  private readonly _dbClient: Knex;
  private _appStateRepository: AppStateRepository;
  private _benderTime: BenderTime;
  private _ethereumLockRepository: EthereumLockRepository;
  private _notionalRepository: NotionalUsdRepository;
  private _wrapUsdVolumeRepository: ProjectionWrapVolumeRepository;
  private _rollingWrapUsdVolumeRepository: ProjectionRollingWrapVolumeRepository;
}
