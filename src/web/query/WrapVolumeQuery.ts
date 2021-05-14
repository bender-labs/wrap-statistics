import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../../domain/BenderTime";
import BigNumber from "bignumber.js";
import {ProjectionWrapVolumeRepository} from "../../repositories/ProjectionWrapVolumeRepository";
import {ProjectionRollingWrapVolumeRepository} from "../../repositories/ProjectionRollingWrapVolumeRepository";
import {ProjectionWrapVolumeDto} from "../dto/ProjectionWrapVolumeDto";
import {DateTime} from "luxon";

interface IntervalWrappingVolume {
  begin: number;
  end: number;
  totalUsd: string;
  data: ProjectionWrapVolumeDto[];
}

interface RollingIntervalWrappingVolume {
  timestamp: number;
  name: string;
  totalUsd: string;
  data: ProjectionWrapVolumeDto[];
}

export class WrapVolumeQuery {

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._wrapUsdVolumeRepository = new ProjectionWrapVolumeRepository(dbClient);
    this._rollingWrapUsdVolumeRepository = new ProjectionRollingWrapVolumeRepository(dbClient);
  }

  async wrappingVolume(interval: string): Promise<IntervalWrappingVolume[]> {
    const wrappingVolumes: IntervalWrappingVolume[] = [];
    const intervals = this._benderIntervals.getIntervals(interval);

    for (const interval of intervals) {
      wrappingVolumes.push(await this._wrappingVolumeFor(interval.start.toMillis(), interval.end.toMillis()));
    }

    return wrappingVolumes;
  }

  private async _wrappingVolumeFor(beginTimeOfRollingInterval: number, endTimeOfRollingInterval: number): Promise<IntervalWrappingVolume> {
    const intervalWrappingVolume: IntervalWrappingVolume = {
      begin: beginTimeOfRollingInterval,
      end: endTimeOfRollingInterval,
      totalUsd: "0",
      data: await this._wrapUsdVolumeRepository.find(beginTimeOfRollingInterval, endTimeOfRollingInterval)
    };

    let totalUsdVolume = new BigNumber(0);
    for (const tokenWrapVolume of intervalWrappingVolume.data) {
      totalUsdVolume = totalUsdVolume.plus(new BigNumber(tokenWrapVolume.value));
    }
    intervalWrappingVolume.totalUsd = totalUsdVolume.toString(10);

    return intervalWrappingVolume;
  }

  async rollingWrappingVolume(name: string): Promise<RollingIntervalWrappingVolume> {
    const rollingIntervalWrappingVolume: RollingIntervalWrappingVolume = {
      timestamp: DateTime.utc().toMillis(),
      name: name,
      totalUsd: "0",
      data: await this._rollingWrapUsdVolumeRepository.findAll(name)
    };

    let totalUsdVolume = new BigNumber(0);
    for (const tokenWrapVolume of rollingIntervalWrappingVolume.data) {
      totalUsdVolume = totalUsdVolume.plus(new BigNumber(tokenWrapVolume.value));
    }
    rollingIntervalWrappingVolume.totalUsd = totalUsdVolume.toString(10);

    return rollingIntervalWrappingVolume;
  }

  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;
  private _wrapUsdVolumeRepository: ProjectionWrapVolumeRepository;
  private _rollingWrapUsdVolumeRepository: ProjectionRollingWrapVolumeRepository;
}
