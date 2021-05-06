import {Knex} from "knex";
import {Logger} from "tslog";
import {EthereumUnlockDto} from "../web/dto/EthereumUnlockDto";
import {EthereumLockDto} from "../web/dto/EthereumLockDto";
import {BenderTime} from "../domain/BenderTime";
import {DateTime} from "luxon";

interface WrappingVolume {
  begin: number;
  end: number;
  usd: number;
}

export class TvlQuery {
  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
  }

  async tvlVolume(interval: string): Promise<WrappingVolume[]> {
    const wrappingVolumes: WrappingVolume[] = [];
    const intervals = this._benderIntervals.getIntervals(interval);

    for (const interval of intervals) {
      this._logger.debug(interval.start.toString() + " => " + interval.end.toString());

      const wrappedVolumeOnInterval = await this._getWrappedVolumeFor(interval.start.toMillis(), interval.end.toMillis());
      const unwrappedVolumeOnInterval = await this._getUnwrappedVolumeFor(interval.start.toMillis(), interval.end.toMillis());

      wrappingVolumes.push({
        begin: interval.start.toMillis(),
        end: interval.end.toMillis(),
        usd: wrappedVolumeOnInterval - unwrappedVolumeOnInterval
      });
    }

    return wrappingVolumes;
  }

  async tvlVolumeNow(): Promise<WrappingVolume> {
    const endTimeOfRollingInterval = DateTime.utc().toMillis();
    const beginTimeOfRollingInterval = DateTime.utc(2021, 3, 26, 14, 0, 0, 0).toMillis();

    const wrappedVolumeOnInterval = await this._getWrappedVolumeFor(beginTimeOfRollingInterval, endTimeOfRollingInterval);
    const unwrappedVolumeOnInterval = await this._getUnwrappedVolumeFor(beginTimeOfRollingInterval, endTimeOfRollingInterval);

    return {
      begin: beginTimeOfRollingInterval,
      end: endTimeOfRollingInterval,
      usd: wrappedVolumeOnInterval - unwrappedVolumeOnInterval
    };
  }

  private async _getWrappedVolumeFor(beginTimeOfRollingInterval: number, endTimeOfRollingInterval: number): Promise<number> {
    const locks: EthereumLockDto[] = await this._dbClient("locks")
      .whereBetween("ethereum_timestamp", [beginTimeOfRollingInterval, endTimeOfRollingInterval])
      .select(this._dbClient.raw("sum(ethereum_notional_value * amount) as lock_usd_total_value"));

    let wrappedVolumeLockUsd = 0;
    locks.forEach((lock) => wrappedVolumeLockUsd += +lock.lockUsdTotalValue);
    return wrappedVolumeLockUsd;
  }

  private async _getUnwrappedVolumeFor(beginTimeOfRollingInterval: number, endTimeOfRollingInterval: number): Promise<number> {
    const unlocks: EthereumUnlockDto[] = await this._dbClient("unlocks")
      .whereBetween("ethereum_timestamp", [beginTimeOfRollingInterval, endTimeOfRollingInterval])
      .select(this._dbClient.raw("sum(ethereum_notional_value * amount) as unlock_usd_total_value"));

    let unwrapVolumeLockUsd = 0;
    unlocks.forEach((unlock) => unwrapVolumeLockUsd += +unlock.unlockUsdTotalValue);
    return unwrapVolumeLockUsd;
  }
}
