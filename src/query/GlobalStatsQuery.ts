import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";
import tokenList from "../domain/TokenList";
import BigNumber from "bignumber.js";
import {NotionalUsdRepository} from "../repositories/NotionalUsdRepository";
import {EthereumLockRepository} from "../repositories/EthereumLockRepository";
import {EthereumUnlockRepository} from "../repositories/EthereumUnlockRepository";
import {globalRewardsUserAllocation, rewards, totalTokenAllocation} from "../domain/Rewards";

interface TokenGlobalStats {
  asset: string;
  wrapVolume: string;
  wrapVolumeUsd: string;
  wrapReward: string;
  wrapRewardUsd: string;
  roi: string;
  apy: string;
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

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dbClient);
  }

  async statsFor(start: number, end: number): Promise<GlobalStats> {
    const result: GlobalStats = {
      tokens: []
    };

    const beginSum = await this._ethereumLockRepository.sumAll(start);
    const endSum = await this._ethereumLockRepository.sumAll(end);
    const endOfIntervalNotionalValues = await this._notionalRepository.findAll(end);

    for (const token of tokenList) {
      if (token.ethereumSymbol !== "WRAP") {
        const beginAmountOnInterval = beginSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? beginSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
        const endAmountOnInterval = endSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? endSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
        const endOfIntervalNotionalValue = endOfIntervalNotionalValues.find(v => v.asset === token.ethereumSymbol);
        const amountOnInterval = new BigNumber(endAmountOnInterval).minus(beginAmountOnInterval);
        const tokenUsdVolume = endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(amountOnInterval) : new BigNumber(0);

        const wrapReward = Math.round(rewards[start] * globalRewardsUserAllocation * (token.allocation / totalTokenAllocation));
        const wrapUsdValue = 15 * wrapReward;

        const roi = new BigNumber(wrapUsdValue).dividedBy(tokenUsdVolume);
        const apy = roi.plus(1).exponentiatedBy(52).minus(1);

        result.tokens.push({
          asset: token.ethereumSymbol,
          wrapVolume: amountOnInterval.toString(10),
          wrapVolumeUsd: tokenUsdVolume.toString(10),
          wrapReward: wrapReward.toString(),
          wrapRewardUsd: wrapUsdValue.toString(),
          roi: roi.toString(10),
          apy: apy.toString(10)
        });
      }
    }


    return result;
  }
}
