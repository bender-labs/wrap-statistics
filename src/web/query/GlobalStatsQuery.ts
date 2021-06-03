import {Knex} from "knex";
import {Logger} from "tslog";
import {BenderTime} from "../../domain/BenderTime";
import tokenList from "../../domain/TokenList";
import BigNumber from "bignumber.js";
import {NotionalUsdRepository} from "../../repositories/NotionalUsdRepository";
import {EthereumLockRepository} from "../../repositories/EthereumLockRepository";
import {EthereumUnlockRepository} from "../../repositories/EthereumUnlockRepository";
import {getTokenRewardForPeriod} from "../../domain/Rewards";
import {WrapXtzPriceRepository} from "../../repositories/WrapXtzPriceRepository";

interface TokenGlobalStats {
  asset: string;
  wrapVolume: string;
  wrapVolumeUsd: string;
  wrapReward: string;
  wrapRewardUsd: string;
  roi: string;
}

interface TokenFeesGlobalStats {
  asset: string;
  wrapVolume: string;
  wrapVolumeUsd: string;
  unwrapVolume: string;
  unwrapVolumeUsd: string;
  fees: string;
  feesUsd: string;
}

interface GlobalStats {
  tokens: Array<TokenGlobalStats>
  fees: Array<TokenFeesGlobalStats>
}

export class GlobalStatsQuery {

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._benderIntervals = new BenderTime();
    this._notionalRepository = new NotionalUsdRepository(dbClient);
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
    this._ethereumUnlockRepository = new EthereumUnlockRepository(dbClient);
    this._wrapPriceRepository = new WrapXtzPriceRepository(dbClient);
  }

  async statsFor(start: number, end: number): Promise<GlobalStats> {
    const result: GlobalStats = {
      tokens: [],
      fees: []
    };

    const lockBeginSum = await this._ethereumLockRepository.sumAll(start);
    const lockEndSum = await this._ethereumLockRepository.sumAll(end);
    const unlockBeginSum = await this._ethereumUnlockRepository.sumAll(start);
    const unlockEndSum = await this._ethereumUnlockRepository.sumAll(end);
    const endOfIntervalNotionalValues = await this._notionalRepository.findAll(end);

    for (const token of tokenList) {
      const endOfIntervalNotionalValue = endOfIntervalNotionalValues.find(v => v.asset === token.ethereumSymbol);

      const lockBeginAmountOnInterval = lockBeginSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? lockBeginSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const lockEndAmountOnInterval = lockEndSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? lockEndSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const lockAmountOnInterval = new BigNumber(lockEndAmountOnInterval).minus(lockBeginAmountOnInterval);
      const wrapUsdVolume = endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(lockAmountOnInterval) : new BigNumber(0);

      const unlockBeginAmountOnInterval = unlockBeginSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? unlockBeginSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const unlockEndAmountOnInterval = unlockEndSum.find(s => s.ethereumSymbol === token.ethereumSymbol) ? unlockEndSum.find(s => s.ethereumSymbol === token.ethereumSymbol).value : "0";
      const unlockAmountOnInterval = new BigNumber(unlockEndAmountOnInterval).minus(unlockBeginAmountOnInterval);
      const unwrapUsdVolume = endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(unlockAmountOnInterval) : new BigNumber(0);

      const wrapReward = getTokenRewardForPeriod(start, end, token);
      const endOfIntervalWrapTezosRatio = await this._wrapPriceRepository.find(end);
      const endOfIntervalTezosUsdPrice = await this._notionalRepository.find("XTZ", end);
      const endOfIntervalWrapUsdPrice = new BigNumber(endOfIntervalWrapTezosRatio.value).multipliedBy(endOfIntervalTezosUsdPrice.value);
      const wrapRewardUsdValue = endOfIntervalWrapUsdPrice.multipliedBy(wrapReward);

      const roi = wrapRewardUsdValue.dividedBy(wrapUsdVolume);

      if (token.allocation > 0) {
        result.tokens.push({
          asset: token.ethereumSymbol,
          wrapVolume: lockAmountOnInterval.toString(10),
          wrapVolumeUsd: wrapUsdVolume.toString(10),
          wrapReward: wrapReward.toString(10),
          wrapRewardUsd: wrapRewardUsdValue.toString(10),
          roi: roi.toString(10)
        });
      }

      const generatedFees = lockAmountOnInterval.multipliedBy(0.0015).plus(unlockAmountOnInterval.multipliedBy(0.0015));
      let generatedFeesInUsd = endOfIntervalNotionalValue ? new BigNumber(endOfIntervalNotionalValue.value).multipliedBy(generatedFees) : new BigNumber(0);
      if (token.tezosSymbol === "WRAP") {
        generatedFeesInUsd = endOfIntervalWrapUsdPrice.multipliedBy(generatedFees);
      }

      result.fees.push({
        asset: token.ethereumSymbol,
        wrapVolume: lockAmountOnInterval.toString(10),
        wrapVolumeUsd: wrapUsdVolume.toString(10),
        unwrapVolume: unlockAmountOnInterval.toString(10),
        unwrapVolumeUsd: unwrapUsdVolume.toString(10),
        fees: generatedFees.toString(10),
        feesUsd: generatedFeesInUsd.toString(10)
      });
    }

    return result;
  }

  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private readonly _benderIntervals: BenderTime;
  private _ethereumLockRepository: EthereumLockRepository;
  private _ethereumUnlockRepository: EthereumUnlockRepository;
  private _notionalRepository: NotionalUsdRepository;
  private _wrapPriceRepository: WrapXtzPriceRepository;
}
