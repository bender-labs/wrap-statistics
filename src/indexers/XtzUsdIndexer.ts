import {StatisticsDependencies} from "./StatisticsDependencies";
import {Logger} from "tslog";
import {Coincap} from "../facades/Coincap";
import {DateTime} from "luxon";
import {BenderTime} from "../domain/BenderTime";
import {Knex} from "knex";
import {AppState} from "./state/AppState";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";

export class XtzUsdIndexer {
  private readonly _logger: Logger;
  private _coincap: Coincap;
  private _appState: AppState;
  private _notionalUsdRepository: NotionalUsdRepository;
  private _dbClient: Knex;

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._coincap = new Coincap();
    this._notionalUsdRepository = new NotionalUsdRepository(dependencies.dbClient);
    this._appState = new AppState(dependencies.dbClient);
    this._dbClient = dependencies.dbClient;
  }

  async index(): Promise<void> {
    this._logger.debug("Indexing notional usd values");
    const nowMs = DateTime.now().toMillis();

    let currentIndexingTimeMs = DateTime.fromMillis(await this._getLastUsdXtzIndexingTimestamp()).plus({"hours": 1}).toMillis();

    while (currentIndexingTimeMs < nowMs) {
      let transaction;
      try {
        this._logger.debug("Xtz usd value for " + DateTime.fromMillis(currentIndexingTimeMs).toString());
        transaction = await this._dbClient.transaction();

        const usdPrice = await this._coincap.getUsdPrice(currentIndexingTimeMs, "tezos", this._logger);

        await this._notionalUsdRepository.save({
          value: usdPrice.toString(),
          asset: "XTZ",
          timestamp: currentIndexingTimeMs
        }, transaction);

        await this._setLastUsdXtzIndexingTimestamp(currentIndexingTimeMs, transaction);
        currentIndexingTimeMs = DateTime.fromMillis(currentIndexingTimeMs).plus({"hours": 1}).toMillis();
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Error building xtz usd values : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  async _setLastUsdXtzIndexingTimestamp(lastNotionalIndexingTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appState.setLastUsdXtzIndexingTimestamp(lastNotionalIndexingTimestamp, transaction);
  }

  async _getLastUsdXtzIndexingTimestamp(): Promise<number> {
    return await this._appState.getLastUsdXtzIndexingTimestamp() ?? BenderTime.startMs;
  }
}
