import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";
import tokenList from "../domain/TokenList";
import BigNumber from "bignumber.js";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import {EthereumLockRepository} from "../repositories/EthereumLockRepository";
import {EthereumUnlockRepository} from "../repositories/EthereumUnlockRepository";
import {globalRewardsUserAllocation, rewards, totalTokenAllocation} from "../domain/Rewards";
import {WrapPriceRepository} from "../repositories/WrapPriceRepository";

interface TokenGlobalStats {
  asset: string;
  wrapVolume: string;
  wrapVolumeUsd: string;
  wrapReward: string;
  wrapRewardUsd: string;
  roi: string;
}

interface GlobalStats {
  tokens: Array<TokenGlobalStats>
}

export class GlobalStatsQuery {
  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;
  private _ethereumLockRepository: EthereumLockRepository;
  private _ethereumUnlockRepository: EthereumUnlockRepository;
  private _notionalRepository: NotionalUsdRepository;
  private _wrapPriceRepository: WrapPriceRepository;

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dbClient);
    this._wrapPriceRepository = new WrapPriceRepository(dbClient);
  }

  private _getRewardForPeriod(start: number, end: number): number {
    let result = 0;
    Object.keys(rewards).forEach(key => {
      const rewardStart = parseInt(key);
      if (rewardStart < end && rewardStart >= start) {
        result += rewards[key];
      }
    });
    return result;
  }

  async statsFor(start: number, end: number): Promise<GlobalStats> {
    const result: GlobalStats = {
      tokens: []
    };

    const beginSum = await this._ethereumLockRepository.sumAll(start);
    const endSum = await this._ethereumLockRepository.sumAll(end);
    const endOfIntervalNotionalValues = await this._notionalRepository.findAll(end);

    for (const token of tokenList) {
      if (token.allocation > 0) {
        const beginAmountOnInterval = beginSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? beginSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
        const endAmountOnInterval = endSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? endSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
        const endOfIntervalNotionalValue = endOfIntervalNotionalValues.find(v => v.asset === token.ethereumSymbol);
        const amountOnInterval = new BigNumber(endAmountOnInterval).minus(beginAmountOnInterval);
        const tokenUsdVolume = endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(amountOnInterval) : new BigNumber(0);

        const wrapReward = Math.round(this._getRewardForPeriod(start, end) * globalRewardsUserAllocation * (token.allocation / totalTokenAllocation));
        const endOfIntervalWrapTezosRatio = await this._wrapPriceRepository.find(end);
        const endOfIntervalTezosUsdPrice = await this._notionalRepository.find("XTZ", end);
        const endOfIntervalWrapUsdPrice = new BigNumber(endOfIntervalWrapTezosRatio.value).multipliedBy(endOfIntervalTezosUsdPrice.value);
        const wrapUsdValue = endOfIntervalWrapUsdPrice.multipliedBy(wrapReward);

        const roi = wrapUsdValue.dividedBy(tokenUsdVolume);

        result.tokens.push({
          asset: token.ethereumSymbol,
          wrapVolume: amountOnInterval.toString(10),
          wrapVolumeUsd: tokenUsdVolume.toString(10),
          wrapReward: wrapReward.toString(),
          wrapRewardUsd: wrapUsdValue.toString(),
          roi: roi.toString(10)
        });
      }
    }


    return result;
  }
}
