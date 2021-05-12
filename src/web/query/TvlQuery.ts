import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../../domain/BenderTime";
import tokenList from "../../domain/TokenList";
import {TvlRepository} from "../../repositories/TvlRepository";
import BigNumber from "bignumber.js";
import {NotionalUsdRepository} from "../../repositories/NotionalUsdRepository";

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

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderTime = new BenderTime();
    this._tvlRepository = new TvlRepository(dbClient);
    this._notionalRepository = new NotionalUsdRepository(dbClient);
  }

  async tvlVolume(interval: string): Promise<IntervalTvlVolume[]> {
    const tvlVolumes: IntervalTvlVolume[] = [];
    const intervals = this._benderTime.getIntervals(interval);

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

    const tvls = await this._tvlRepository.findAll(timestamp);
    const notionals = await this._notionalRepository.findAll(timestamp);

    for (const token of tokenList) {
      const tvl = tvls.find(t => t.asset === token.ethereumSymbol);
      const notionalValue = notionals.find(t => t.asset === token.ethereumSymbol);
      const tokenUsdVolume = notionalValue && tvl ? new BigNumber(notionalValue.value).multipliedBy(tvl.value) : new BigNumber(0);

      tvlIntervalVolume.data.push({
        asset: token.ethereumSymbol,
        usd: tokenUsdVolume.toString(10)
      });

      totalUsdVolume = totalUsdVolume.plus(tokenUsdVolume);
    }

    tvlIntervalVolume.totalUsd = totalUsdVolume.toString(10);

    return tvlIntervalVolume;
  }

  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderTime: BenderTime;
  private _tvlRepository: TvlRepository;
  private _notionalRepository: NotionalUsdRepository;
}
