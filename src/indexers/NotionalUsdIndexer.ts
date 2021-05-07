import {StatisticsDependencies} from "./StatisticsDependencies";
import {Logger} from "tslog";
import {Coincap} from "../facades/Coincap";
import {DateTime} from "luxon";
import {BenderTime} from "../domain/BenderTime";
import {Knex} from "knex";
import {AppState} from "./state/AppState";
import tokenList from "../domain/TokenList";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";

export class NotionalUsdIndexer {
  private readonly _logger: Logger;
  private _coincap: Coincap;
  private _appState: AppState;
  private _notionalUsdRepository: NotionalUsdRepository;
  private _dbClient: Knex;

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._coincap = new Coincap();
    this._appState = new AppState(dependencies.dbClient);
    this._notionalUsdRepository = new NotionalUsdRepository(dependencies.dbClient);
    this._dbClient = dependencies.dbClient;
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

        for (const token of tokenList) {
          const usdPrice = await this._coincap.getUsdPrice(token.token, currentIndexingTimeMs, this._logger);
          await this._notionalUsdRepository.save({
            value: usdPrice ? usdPrice.toString() : (token.ethereumSymbol === "HUSD" ? "1" : "0"),
            asset: token.ethereumSymbol,
            timestamp: currentIndexingTimeMs
          }, transaction);
        }

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

  async _setLastNotionalIndexingTimestamp(lastNotionalIndexingTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setLastNotionalIndexingTimestamp(lastNotionalIndexingTimestamp, transaction);
  }

  async _getLastNotionalIndexingTimestamp(): Promise<number> {
    return await this._appState.getLastNotionalIndexingTimestamp() ?? BenderTime.startMs;
  }
}
