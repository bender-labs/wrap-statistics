import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";
import tokenList from "../domain/TokenList";
import {TvlRepository} from "../repositories/TvlRepository";
import BigNumber from "bignumber.js";
import {Token} from "../domain/Token";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";

interface TvlVolume {
  asset: string;
  usd: string;
}

interface IntervalTvlVolume {
  time: number;
  totalUsd: string;
  data: TvlVolume[];
}

export class TvlQuery {
  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;
  private _tvlRepository: TvlRepository;
  private _notionalRepository: NotionalUsdRepository;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._tvlRepository = new TvlRepository(dbClient);
    this._notionalRepository = new NotionalUsdRepository(dbClient);
  }

  async tvlVolume(interval: string): Promise<IntervalTvlVolume[]> {
    const tvlVolumes: IntervalTvlVolume[] = [];
    const intervals = this._benderIntervals.getIntervals(interval);

    for (const interval of intervals) {
      tvlVolumes.push(await this.tvlUsdVolumeFor(interval.end.toMillis()));
    }

    return tvlVolumes;
  }

  async tvlUsdVolumeFor(timestamp: number): Promise<IntervalTvlVolume> {
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
  }

  private async _getTvlVolumeFor(token: Token, currentTimestamp: number): Promise<BigNumber> {
    const tvl = await this._tvlRepository.find(token.ethereumSymbol, currentTimestamp);
    const notionalValue = await this._notionalRepository.find(token.ethereumSymbol, currentTimestamp);
    return notionalValue && tvl ? new BigNumber(notionalValue.value).multipliedBy(tvl.value) : new BigNumber(0);
  }
}
