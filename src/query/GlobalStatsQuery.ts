import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";
import tokenList from "../domain/TokenList";
import {TvlRepository} from "../repositories/TvlRepository";
import BigNumber from "bignumber.js";
import {Token} from "../domain/Token";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import {EthereumLockRepository} from "../repositories/EthereumLockRepository";
import {DateTime} from "luxon";
import {EthereumUnlockRepository} from "../repositories/EthereumUnlockRepository";

interface TokenStats {
  asset: string;
  supply: string;
  tvl: string;
}

interface Stats {
  tokens: Array<TokenStats>
}

export class GlobalStatsQuery {
  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;
  private _ethereumLockRepository: EthereumLockRepository;
  private _ethereumUnlockRepository: EthereumUnlockRepository;
  private _tvlRepository: TvlRepository;
  private _notionalRepository: NotionalUsdRepository;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._tvlRepository = new TvlRepository(dbClient);
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dbClient);
  }

  async statsFor(week: string): Promise<Stats> {
    const result: Stats = {
      tokens: []
    }
    const now = DateTime.utc().toMillis();
    const locks = await this._ethereumLockRepository.sumAll(now);
    const unlocks = await this._ethereumUnlockRepository.sumAll(now);
    const tvls = await this._tvlRepository.findAll(now);
    const notionals = await this._notionalRepository.findAll(now);

    for (const token of tokenList) {
      const totalLocked = locks.find(s => s.ethereumSymbol === token.ethereumSymbol) ? locks.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const totalUnlocked = unlocks.find(s => s.ethereumSymbol === token.ethereumSymbol) ? unlocks.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const supply = new BigNumber(totalLocked).minus(new BigNumber(totalUnlocked));
      const notional = notionals.find(v => v.asset === token.ethereumSymbol);
      const tokenTvl = notional ? new BigNumber(notional.value).multipliedBy(supply) : new BigNumber(0);
      result.tokens.push({
        asset: token.ethereumSymbol,
        supply: supply.toString(10),
        tvl: tokenTvl.toString(10)
      });
    }
    return result;
  }

  /*async tvlUsdVolumeFor(timestamp: number): Promise<IntervalTvlVolume> {
    const tvlIntervalVolume: IntervalTvlVolume = {
      time: timestamp,
      totalUsd: "0",
      data: []
    };
    let totalUsdVolume = new BigNumber(0);

    for (const token of tokenList) {
      const tokenUsdVolume = await this._getTvlVolumeFor(token, timestamp);

      tvlIntervalVolume.data.push({
        asset: token.ethereumSymbol,
        usd: tokenUsdVolume.toString()
      });

      totalUsdVolume = totalUsdVolume.plus(tokenUsdVolume);
    }

    tvlIntervalVolume.totalUsd = totalUsdVolume.toString();

    return tvlIntervalVolume;
  }*/

  private async _getTvlVolumeFor(token: Token, currentTimestamp: number): Promise<BigNumber> {
    const tvl = await this._tvlRepository.find(token.ethereumSymbol, currentTimestamp);
    const notionalValue = await this._notionalRepository.find(token.ethereumSymbol, currentTimestamp);
    return notionalValue && tvl ? new BigNumber(notionalValue.value).multipliedBy(tvl.value) : new BigNumber(0);
  }
}
