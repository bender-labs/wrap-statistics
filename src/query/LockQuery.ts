import {Knex} from "knex";
import {EthereumLock} from "../domain/EthereumLock";
import {Coincap} from "../facades/Coincap";
import {Logger} from "tslog";
import BigNumber from "bignumber.js";

export class LockQuery {
  private _dbClient: Knex;
  private _logger: Logger;
  private _coincap: Coincap;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._coincap = new Coincap();
  }

  async search(ethereumFrom: string, token: string, ethereumSymbol: string, tezosTo: string): Promise<EthereumLock[]> {
    const locks: EthereumLock[] = await this._dbClient
      .table<EthereumLock>('locks')
      .select("ethereum_symbol", "token")
      .count({lock_count: "*"})
      .sum({token_volume: "amount"})
      .select(this._dbClient.raw("sum(ethereum_notional_value * amount) as lock_usd_total_value"))
      .where(function () {
        if (ethereumFrom) {
          this.orWhere({ethereumFrom: ethereumFrom.toLowerCase()});
        }
        if (token) {
          this.orWhere({token: token.toLowerCase()});
        }
        if (ethereumSymbol) {
          this.orWhere({ethereumSymbol: ethereumSymbol});
        }
        if (tezosTo) {
          this.orWhere({tezosTo: tezosTo.toLowerCase()});
        }
      })
      .groupBy("ethereum_symbol", "token")
      .orderBy("lock_usd_total_value", "desc");

    await Promise.all(locks.map(async (lock) => {
      const currentUsdPrice = await this._coincap.getUsdPrice(lock.token.toLowerCase(), new Date().getTime(), this._logger);
      lock["currentUsdTotalValue"] = new BigNumber(currentUsdPrice ).multipliedBy(lock["tokenVolume"]).toString();
    }));

    return locks;
  }
}
