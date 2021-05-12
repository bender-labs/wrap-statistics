import {Knex} from "knex";
import {EthereumLock} from "../../domain/events/EthereumLock";
import {Coincap} from "../../facades/Coincap";
import {Logger} from "tslog";
import BigNumber from "bignumber.js";
import {EthereumLockDto} from "../dto/EthereumLockDto";
import {AppStateRepository} from "../../repositories/AppStateRepository";
import {EthereumConfig} from "../../configuration";

export class LockQuery {

  constructor(dbClient: Knex, ethereumConfiguration: EthereumConfig, logger: Logger) {
    this._dbClient = dbClient;
    this._appState = new AppStateRepository(this._dbClient);
    this._logger = logger;
    this._coincap = new Coincap();
    this._ethereumConfig = ethereumConfiguration;
  }

  async search(ethereumFrom: string, token: string, ethereumSymbol: string, tezosTo: string): Promise<EthereumLockDto[]> {
    const lastIndexedEthereumBlock = await this.getLastIndexedEthereumBlock();

    const locks: EthereumLockDto[] = await this._dbClient
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
      const currentUsdPrice = await this._coincap.getUsdPriceForToken(lock.token.toLowerCase(), new Date().getTime(), this._logger);
      lock.currentUsdTotalValue = new BigNumber(currentUsdPrice).multipliedBy(lock["tokenVolume"]).toString();
      lock.lastIndexedBlock = lastIndexedEthereumBlock;
    }));

    return locks;
  }

  async getLastIndexedEthereumBlock(): Promise<number> {
    return await this._appState.getEthereumWrapLastIndexedBlockNumber() ?? this._ethereumConfig.firstBlockToIndex;
  }

  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private _coincap: Coincap;
  private _appState: AppStateRepository;
  private _ethereumConfig: EthereumConfig;
}
