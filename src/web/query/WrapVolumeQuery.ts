import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../../domain/BenderTime";
import BigNumber from "bignumber.js";
import {WrapUsdVolumeRepository} from "../../repositories/WrapUsdVolumeRepository";
import {RollingWrapUsdVolumeRepository} from "../../repositories/RollingWrapUsdVolumeRepository";
import {WrapUsdVolumeDto} from "../dto/WrapUsdVolumeDto";
import {DateTime} from "luxon";

interface IntervalWrappingVolume {
  begin: number;
  end: number;
  totalUsd: string;
  data: WrapUsdVolumeDto[];
}

interface RollingIntervalWrappingVolume {
  timestamp: number;
  name: string;
  totalUsd: string;
  data: WrapUsdVolumeDto[];
}

export class WrapVolumeQuery {

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._wrapUsdVolumeRepository = new WrapUsdVolumeRepository(dbClient);
    this._rollingWrapUsdVolumeRepository = new RollingWrapUsdVolumeRepository(dbClient);
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
  private _wrapUsdVolumeRepository: WrapUsdVolumeRepository;
  private _rollingWrapUsdVolumeRepository: RollingWrapUsdVolumeRepository;
}
