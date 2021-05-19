import {StatisticsDependencies} from "../StatisticsDependencies";
import {Logger} from "tslog";
import {Coincap} from "../../facades/Coincap";
import {DateTime} from "luxon";
import {BenderTime} from "../../domain/BenderTime";
import {Knex} from "knex";
import {AppStateRepository} from "../../repositories/AppStateRepository";
import tokenList from "../../domain/TokenList";
import {NotionalUsdRepository} from "../../repositories/NotionalUsdRepository";
import {Coinmetrics} from "../../facades/Coinmetrics";

export class NotionalUsdIndexer {

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._coincap = new Coincap();
    this._appState = new AppStateRepository(dependencies.dbClient);
    this._notionalUsdRepository = new NotionalUsdRepository(dependencies.dbClient);
    this._dbClient = dependencies.dbClient;
    this._coinMetrics = new Coinmetrics();
  }

  async index(): Promise<void> {
    this._logger.debug("Indexing notional usd values");
    const nowMs = DateTime.now().toMillis();

    let currentIndexingTimeMs = DateTime.fromMillis(await this._getLastNotionalIndexingTimestamp()).plus({"hours": 1}).toMillis();

    while (currentIndexingTimeMs < nowMs) {
      let transaction;
      try {
        this._logger.debug("Notional values for " + DateTime.fromMillis(currentIndexingTimeMs).toString());
        transaction = await this._dbClient.transaction();
        const lastHourClosing = BenderTime.getLastClosingHourTimestamp(currentIndexingTimeMs);
        await this._notionalPriceForTokens(lastHourClosing, transaction);
        await this._notionalPriceForXtz(lastHourClosing, transaction);
        await this._setLastNotionalIndexingTimestamp(currentIndexingTimeMs, transaction);
        currentIndexingTimeMs = DateTime.fromMillis(currentIndexingTimeMs).plus({"hours": 1}).toMillis();
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Error building notional usd values : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  async _notionalPriceForTokens(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    for (const token of tokenList) {
      let usdPrice = await this._coincap.getUsdPriceForToken(token.token, currentIndexingTimeMs, this._logger);
      if (usdPrice === 0) {
        usdPrice = await this._coinMetrics.getUsdPriceForToken(currentIndexingTimeMs, token.token, this._logger);
      }
      await this._notionalUsdRepository.save({
        value: usdPrice ? usdPrice.toString() : (token.ethereumSymbol === "HUSD" ? "1" : "0"),
        asset: token.ethereumSymbol,
        timestamp: currentIndexingTimeMs
      }, transaction);
    }
  }

  async _notionalPriceForXtz(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    let usdPrice = await this._coincap.getUsdPrice(currentIndexingTimeMs, "tezos", this._logger);
    if (usdPrice === 0) {
      usdPrice = await this._coinMetrics.getUsdPrice(currentIndexingTimeMs, "xtz", this._logger);
    }
    await this._notionalUsdRepository.save({
      value: usdPrice.toString(),
      asset: "XTZ",
      timestamp: currentIndexingTimeMs
    }, transaction);
  }

  async _setLastNotionalIndexingTimestamp(lastTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setLastNotionalIndexingTimestamp(lastTimestamp, transaction);
  }

  async _getLastNotionalIndexingTimestamp(): Promise<number> {
    return await this._appState.getLastNotionalIndexingTimestamp() ?? BenderTime.startMs;
  }

  private readonly _logger: Logger;
  private _coincap: Coincap;
  private _appState: AppStateRepository;
  private _notionalUsdRepository: NotionalUsdRepository;
  private _dbClient: Knex;
  private _coinMetrics: Coinmetrics;
}
