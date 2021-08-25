import {Logger} from "tslog";
import {Knex} from "knex";
import {AppStateRepository} from "../repositories/AppStateRepository";
import {StatisticsDependencies} from "../indexers/StatisticsDependencies";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import BigNumber from "bignumber.js";
import {WrapXtzPriceRepository} from "../repositories/WrapXtzPriceRepository";
import {ProjectionWrapTokenInUsdRepository} from "../repositories/ProjectionWrapTokenInUsdRepository";

export class WrapTokenUsdPriceBuilder {


  constructor({logger, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._appStateRepository = new AppStateRepository(dbClient);
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._wrapXtzPriceRepository = new WrapXtzPriceRepository(dbClient);
    this._projectionWrapTokenInUsdRepository = new ProjectionWrapTokenInUsdRepository(dbClient);
  }

  async build(): Promise<void> {
    this._logger.debug("building wrap token usd prices");
    const lastWrapTokenTimestamp = await this._appStateRepository.getLastWrapTokenUsdPrice();
    const lastNotionalIndexed = await this._appStateRepository.getLastNotionalIndexingTimestamp();
    const lastWrapXtzTimestamp = await this._getLastIndexedWrapXtzTimestamp();
    if (lastNotionalIndexed && lastWrapXtzTimestamp) {
      const maxTimestampToProcess = Math.min(lastNotionalIndexed, lastWrapXtzTimestamp);
      const xtzInUsds = await this._notionalRepository.findAllBetween("XTZ", lastWrapTokenTimestamp + 1, maxTimestampToProcess)
      for (const xtzInUsd of xtzInUsds) {
        let transaction;
        try {
          this._logger.debug("building wrap token usd price @ " + xtzInUsd.timestamp);
          transaction = await this._dbClient.transaction();
          const wrapTokenPriceInXtz = await this._wrapXtzPriceRepository.find(xtzInUsd.timestamp);
          const wrapTokenInUsd = new BigNumber(wrapTokenPriceInXtz.value).multipliedBy(xtzInUsd.value).toString(10);
          await this._projectionWrapTokenInUsdRepository.save({value: wrapTokenInUsd, timestamp: xtzInUsd.timestamp}, transaction);
          await this._appStateRepository.setLastWrapTokenUsdPrice(xtzInUsd.timestamp, transaction);
          await transaction.commit();
        } catch (e) {
          this._logger.error(`Error building wrap token usd prices : ${e.message}`);
          if (transaction) {
            transaction.rollback();
          }
          return;
        }
      }
    }
  }

  private async _getLastIndexedWrapXtzTimestamp(): Promise<number | null> {
    const lastLevelForWrapXtz = await this._appStateRepository.getLastQuipuswapIndexedLevel();
    return (await this._wrapXtzPriceRepository.findByLevel(lastLevelForWrapXtz)).timestamp;
  }

  private _logger: Logger;
  private readonly _dbClient: Knex;
  private _appStateRepository: AppStateRepository;
  private _notionalRepository: NotionalUsdRepository;
  private _wrapXtzPriceRepository: WrapXtzPriceRepository;
  private _projectionWrapTokenInUsdRepository: ProjectionWrapTokenInUsdRepository;
}
