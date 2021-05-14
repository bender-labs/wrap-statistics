import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../../domain/BenderTime";
import tokenList from "../../domain/TokenList";
import {ProjectionTotalValueLockedRepository} from "../../repositories/ProjectionTotalValueLockedRepository";
import BigNumber from "bignumber.js";
import {ProjectionTotalValueLockedDto} from "../dto/ProjectionTotalValueLockedDto";

interface IntervalTvlVolume {
  time: number;
  totalUsd: string;
  data: ProjectionTotalValueLockedDto[];
}

export class TotalValueLockedQuery {

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderTime = new BenderTime();
    this._tvlRepository = new ProjectionTotalValueLockedRepository(dbClient);
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

    const totalValueLockeds = await this._tvlRepository.findAll(timestamp);

    for (const token of tokenList) {
      const totalValueLocked = totalValueLockeds.find(t => t.asset === token.ethereumSymbol);

      tvlIntervalVolume.data.push({
        asset: totalValueLocked.asset,
        usd: totalValueLocked.usd_value,
        amount: totalValueLocked.amount
      });

      totalUsdVolume = totalUsdVolume.plus(totalValueLocked.usd_value);
    }

    tvlIntervalVolume.totalUsd = totalUsdVolume.toString(10);

    return tvlIntervalVolume;
  }

  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderTime: BenderTime;
  private _tvlRepository: ProjectionTotalValueLockedRepository;
}
