import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";
import tokenList from "../domain/TokenList";
import BigNumber from "bignumber.js";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import {EthereumLockRepository} from "../repositories/EthereumLockRepository";
import {Token} from "../domain/Token";

interface WrappingVolume {
  asset: string;
  usd: string;
}

interface IntervalWrappingVolume {
  begin: number;
  end: number;
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
      data: []
    };
    let totalUsdVolume = new BigNumber(0);

    for (const token of tokenList) {
      const tokenUsdVolume = await this._getUsdVolumeFor(token, beginTimeOfRollingInterval, endTimeOfRollingInterval);

      wrappingRollingVolume.data.push({
        asset: token.ethereumSymbol,
        usd: tokenUsdVolume.toString()
      });

      totalUsdVolume = totalUsdVolume.plus(tokenUsdVolume);
    }

    wrappingRollingVolume.data.push({
      asset: "TOTAL",
      usd: totalUsdVolume.toString()
    });

    return wrappingRollingVolume;
  }

  private async _getUsdVolumeFor(token: Token, beginTimeOfRollingInterval: number, endTimeOfRollingInterval: number): Promise<BigNumber> {
    const beginAmountOnInterval = await this._ethereumLockRepository.sumToken(token, beginTimeOfRollingInterval);
    const endAmountOnInterval = await this._ethereumLockRepository.sumToken(token, endTimeOfRollingInterval);
    const amountOnInterval = new BigNumber(endAmountOnInterval).minus(beginAmountOnInterval);
    const endOfIntervalNotionalValue = await this._notionalRepository.find(token.ethereumSymbol, endTimeOfRollingInterval);
    return endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(amountOnInterval) : new BigNumber(0);
  }
}
