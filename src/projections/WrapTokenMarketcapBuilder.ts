import {Logger} from "tslog";
import {Knex} from "knex";
import {AppStateRepository} from "../repositories/AppStateRepository";
import {StatisticsDependencies} from "../indexers/StatisticsDependencies";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import BigNumber from "bignumber.js";
import {WrapXtzPriceRepository} from "../repositories/WrapXtzPriceRepository";
import {WrapTokenTotalSupplyRepository} from "../repositories/WrapTokenTotalSupplyRepository";
import {ProjectionWrapTokenMarketcapRepository} from "../repositories/ProjectionWrapTokenMarketcapRepository";

export class WrapTokenMarketcapBuilder {

  constructor({logger, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._appStateRepository = new AppStateRepository(dbClient);
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._wrapXtzPriceRepository = new WrapXtzPriceRepository(dbClient);
    this._wrapTokenTotalSupplyRepository = new WrapTokenTotalSupplyRepository(dbClient);
    this._projectionWrapTokenMarketcapRepository = new ProjectionWrapTokenMarketcapRepository(dbClient);
  }

  async build(): Promise<void> {
    this._logger.debug("building wrap token marketcap");
    const lastWrapTokenTimestamp = await this._appStateRepository.getLastWrapTokenMarketcap();
    const lastNotionalIndexed = await this._appStateRepository.getLastNotionalIndexingTimestamp();
    const lastWrapXtzTimestamp = await this._getLastIndexedWrapXtzTimestamp();
    const lastWrapTotalSupplyTimestamp = await this._getLastIndexedWrapTotalSupplyTimestamp();
    if (lastNotionalIndexed && lastWrapXtzTimestamp && lastWrapTotalSupplyTimestamp) {
      const maxTimestampToProcess = Math.min(lastNotionalIndexed, lastWrapXtzTimestamp, lastWrapTotalSupplyTimestamp);
      const xtzInUsds = await this._notionalRepository.findAllBetween("XTZ", lastWrapTokenTimestamp + 1, maxTimestampToProcess)
      for (const xtzInUsd of xtzInUsds) {
        let transaction;
        try {
          this._logger.debug("building wrap token marketcap @ " + xtzInUsd.timestamp);
          transaction = await this._dbClient.transaction();
          const wrapTokenPriceInXtz = await this._wrapXtzPriceRepository.find(xtzInUsd.timestamp);
          const totalSupply = await this._wrapTokenTotalSupplyRepository.find(xtzInUsd.timestamp);
          const wrapTokenInUsd = new BigNumber(wrapTokenPriceInXtz.value).multipliedBy(xtzInUsd.value);
          if (!wrapTokenPriceInXtz || !totalSupply || !wrapTokenInUsd) {
            return;
          }
          const marketcap = wrapTokenInUsd.multipliedBy(new BigNumber(totalSupply.value)).toString(10);
          await this._projectionWrapTokenMarketcapRepository.save({value: marketcap, timestamp: xtzInUsd.timestamp}, transaction);
          await this._appStateRepository.setLastWrapTokenMarketcap(xtzInUsd.timestamp, transaction);
          await transaction.commit();
        } catch (e) {
          this._logger.error(`Error building wrap token marketcap : ${e.message}`);
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

  private async _getLastIndexedWrapTotalSupplyTimestamp(): Promise<number | null> {
    const lastLevelForWrapXtz = await this._appStateRepository.getLastWrapTokenTotalSupplyIndexedLevel();
    return (await this._wrapTokenTotalSupplyRepository.findByLevel(lastLevelForWrapXtz)).timestamp;
  }

  private _logger: Logger;
  private readonly _dbClient: Knex;
  private _appStateRepository: AppStateRepository;
  private _notionalRepository: NotionalUsdRepository;
  private _wrapXtzPriceRepository: WrapXtzPriceRepository;
  private _wrapTokenTotalSupplyRepository: WrapTokenTotalSupplyRepository;
  private _projectionWrapTokenMarketcapRepository: ProjectionWrapTokenMarketcapRepository;
}
