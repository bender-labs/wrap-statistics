import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";
import tokenList from "../domain/TokenList";
import BigNumber from "bignumber.js";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import {EthereumLockRepository} from "../repositories/EthereumLockRepository";

interface WrappingVolume {
  asset: string;
  usd: string;
}

interface IntervalWrappingVolume {
  begin: number;
  end: number;
  totalUsd: string;
  data: WrappingVolume[];
}

export class WrapQuery {
  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;
  private _notionalRepository: NotionalUsdRepository;
  private _ethereumLockRepository: EthereumLockRepository;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
  }

  async wrappingVolume(interval: string): Promise<IntervalWrappingVolume[]> {
    const wrappingVolumes: IntervalWrappingVolume[] = [];
    const intervals = this._benderIntervals.getIntervals(interval);

    for (const interval of intervals) {
      wrappingVolumes.push(await this.wrappingVolumeFor(interval.start.toMillis(), interval.end.toMillis()));
    }

    return wrappingVolumes;
  }

  async wrappingVolumeFor(beginTimeOfRollingInterval: number, endTimeOfRollingInterval: number): Promise<IntervalWrappingVolume> {
    const wrappingRollingVolume: IntervalWrappingVolume = {
      begin: beginTimeOfRollingInterval,
      end: endTimeOfRollingInterval,
      totalUsd: "0",
      data: []
    };
    let totalUsdVolume = new BigNumber(0);

    const beginSum = await this._ethereumLockRepository.sumAll(beginTimeOfRollingInterval);
    const endSum = await this._ethereumLockRepository.sumAll(endTimeOfRollingInterval);
    const endOfIntervalNotionalValues = await this._notionalRepository.findAll(endTimeOfRollingInterval);

    for (const token of tokenList) {
      const beginAmountOnInterval = beginSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? beginSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const endAmountOnInterval = endSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? endSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const endOfIntervalNotionalValue = endOfIntervalNotionalValues.find(v => v.asset === token.ethereumSymbol);
      const amountOnInterval = new BigNumber(endAmountOnInterval).minus(beginAmountOnInterval);
      const tokenUsdVolume = endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(amountOnInterval) : new BigNumber(0);

      wrappingRollingVolume.data.push({
        asset: token.ethereumSymbol,
        usd: tokenUsdVolume.toString(10)
      });

      totalUsdVolume = totalUsdVolume.plus(tokenUsdVolume);
    }

    wrappingRollingVolume.totalUsd = totalUsdVolume.toString(10);

    return wrappingRollingVolume;
  }
}
