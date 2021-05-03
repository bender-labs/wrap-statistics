import {Knex} from "knex";
import {Logger} from "tslog";
import {EthereumLockDto} from "../web/dto/EthereumLockDto";
import {BenderIntervals} from "../domain/BenderIntervals";
import {DateTime} from "luxon";

interface WrappingVolume {
  begin: number;
  end: number;
  usd: number;
}

export class WrapQuery {
  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderIntervals;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderIntervals();
  }

  async wrappingVolume(interval: string): Promise<WrappingVolume[]> {
    const wrappingVolumes: WrappingVolume[] = [];
    const intervals = this._benderIntervals.getIntervals(interval);

    for (const interval of intervals) {
      this._logger.debug(interval.start.toString() + " => " + interval.end.toString());

      wrappingVolumes.push({
        begin: interval.start.toMillis(),
        end: interval.end.toMillis(),
        usd: await this._getRollingVolumeFor(interval.start.toMillis(), interval.end.toMillis())
      });
    }

    return wrappingVolumes;
  }

  async wrappingRollingVolume(): Promise<WrappingVolume> {
    const endTimeOfRollingInterval = DateTime.utc().toMillis();
    const beginTimeOfRollingInterval = DateTime.utc().minus({days: 1}).toMillis();

    return {
      begin: beginTimeOfRollingInterval,
      end: endTimeOfRollingInterval,
      usd: await this._getRollingVolumeFor(beginTimeOfRollingInterval, endTimeOfRollingInterval)
    };
  }

  private async _getRollingVolumeFor(beginTimeOfRollingInterval: number, endTimeOfRollingInterval: number): Promise<number> {
    const locks: EthereumLockDto[] = await this._dbClient("locks")
      .whereBetween("ethereum_timestamp", [beginTimeOfRollingInterval, endTimeOfRollingInterval])
      .select(this._dbClient.raw("sum(ethereum_notional_value * amount) as lock_usd_total_value"));

    let rollingVolumeLockUsd = 0;
    locks.forEach((lock) => rollingVolumeLockUsd += +lock.lockUsdTotalValue);
    return rollingVolumeLockUsd;
  }
}
