import {StatisticsDependencies} from "../StatisticsDependencies";
import {Logger} from "tslog";
import {DateTime} from "luxon";
import {Knex} from "knex";
import {NotionalUsdRepository} from "../../repositories/NotionalUsdRepository";
import {WrapIndexer} from "../../facades/WrapIndexer";
import BigNumber from "bignumber.js";
import {TzktProvider} from "../../infrastructure/tezos/tzktProvider";
import programs from "./programs";
import {TezosToolkit} from "@taquito/taquito";
import {WrapXtzPriceRepository} from "../../repositories/WrapXtzPriceRepository";
import {LiquidityMiningApy} from "../../domain/LiquidityMiningApy";
import {LiquidityMiningApyRepository} from "../../repositories/LiquidityMiningApyRepository";

type LiquidityMiningStorage = {
  farm: {
    plannedRewards: {
      rewardPerBlock: string;
      totalBlocks: string;
    },
    claimedRewards: {
      paid: string;
      unpaid: string;
    },
  },
  farmLpTokenBalance: string;
}

type QuipuswapStorage = {
  storage: {
    tez_pool: string;
    total_supply: string;
  }
}

export class LiquidityMiningPoolsIndexer {

  constructor({logger, dbClient, tzktProvider, tezosToolkit}: StatisticsDependencies) {
    this._logger = logger;
    this._tezosToolkit = tezosToolkit;
    this._tzktProvider = tzktProvider;
    this._wrapIndexer = new WrapIndexer();
    this._wrapPriceRepository = new WrapXtzPriceRepository(dbClient);
    this._notionalUsdRepository = new NotionalUsdRepository(dbClient);
    this._liquidityMiningApyRepository = new LiquidityMiningApyRepository(dbClient);
    this._dbClient = dbClient;
  }

  private runningStats(storage: LiquidityMiningStorage, blockDurationInSeconds: number): { running: boolean, remainingBlocks: number, remainingSeconds: number } {
    const rewardsPerBlock = new BigNumber(storage.farm.plannedRewards.rewardPerBlock);
    const totalRewards = rewardsPerBlock.multipliedBy(new BigNumber(storage.farm.plannedRewards.totalBlocks));
    const totalPaid = new BigNumber(storage.farm.claimedRewards.paid).plus(new BigNumber(storage.farm.claimedRewards.unpaid));
    if (totalPaid.isEqualTo(totalRewards)) {
      return {
        running: false,
        remainingSeconds: 0,
        remainingBlocks: 0
      }
    }
    const remainingBlocks = totalRewards.minus(totalPaid).dividedBy(rewardsPerBlock);
    const remainingSeconds = remainingBlocks.multipliedBy(blockDurationInSeconds);
    return {
      running: true,
      remainingBlocks: remainingBlocks.integerValue().toNumber(),
      remainingSeconds: remainingSeconds.integerValue().toNumber()
    };
  }

  async index(): Promise<void> {
    this._logger.debug("Indexing liquidity mining pools");
    let transaction;
    try {
      const result: Array<LiquidityMiningApy> = [];
      const blockDurationInSeconds = await this._getBlockDurationInSeconds();
      const currentWrapPriceInUsd = await this._wrapPrice();
      const xtzPriceInDollars = await this._notionalUsdRepository.find('XTZ', DateTime.now().toMillis());
      for (const program of programs) {
        const farmingStorage = await this._tzktProvider.getStorage<LiquidityMiningStorage>(program.farmingContract);
        const quipuStorage = await this._tzktProvider.getStorage<QuipuswapStorage>(program.quipuswapContract);
        const tezInPool = new BigNumber(quipuStorage.storage.tez_pool).shiftedBy(-6);
        const lpStaked = new BigNumber(farmingStorage.farmLpTokenBalance);
        const lpSupply = new BigNumber(quipuStorage.storage.total_supply);
        const wrapRewardsPerBlock = new BigNumber(farmingStorage.farm.plannedRewards.rewardPerBlock).shiftedBy(-8);
        const totalDollarsInLiquidityPool = lpStaked.dividedBy(lpSupply).multipliedBy(tezInPool).multipliedBy(new BigNumber(xtzPriceInDollars.value)).multipliedBy(2);
        const wrapRewardsPerDay = wrapRewardsPerBlock.multipliedBy(60 / blockDurationInSeconds).multipliedBy(60 * 24);
        const wrapRewardsPerDayInUsd = wrapRewardsPerDay.multipliedBy(currentWrapPriceInUsd);
        const apy = wrapRewardsPerDayInUsd.dividedBy(totalDollarsInLiquidityPool).plus(1).exponentiatedBy(365).minus(1).multipliedBy(100);
        const apr = wrapRewardsPerDayInUsd.dividedBy(totalDollarsInLiquidityPool).multipliedBy(365).multipliedBy(100);
        const runningStats = this.runningStats(farmingStorage, blockDurationInSeconds);
        result.push({
          base: program.base,
          quote: program.quote,
          apy: apy.toString(10),
          apr: apr.toString(10),
          totalRewardsPerDay: wrapRewardsPerDay.toString(10),
          totalRewardsPerDayInUsd: wrapRewardsPerDayInUsd.toString(10),
          totalStakedInUsd: totalDollarsInLiquidityPool.toString(10),
          farmingContract: program.farmingContract,
          quipuswapContract: program.quipuswapContract,
          ...runningStats
        });
      }
      transaction = await this._dbClient.transaction();
      await this._liquidityMiningApyRepository.saveAll(result, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Error building liquidity mining pools: ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private async _getBlockDurationInSeconds(): Promise<number> {
    const block = await this._tezosToolkit.rpc.getBlockHeader();
    return block.protocol.startsWith('PsFLoren') ? 60 : 30;
  }

  private async _wrapPrice(): Promise<BigNumber> {
    const wrapPriceInXtz = await this._wrapPriceRepository.find(DateTime.now().toMillis());
    const tezosPriceInUsd = await this._notionalUsdRepository.find("XTZ", DateTime.now().toMillis());
    return new BigNumber(wrapPriceInXtz.value).multipliedBy(tezosPriceInUsd.value);
  }

  private readonly _logger: Logger;
  private _wrapIndexer: WrapIndexer;
  private _notionalUsdRepository: NotionalUsdRepository;
  private _wrapPriceRepository: WrapXtzPriceRepository;
  private _liquidityMiningApyRepository: LiquidityMiningApyRepository;
  private _tzktProvider: TzktProvider;
  private _dbClient: Knex;
  private _tezosToolkit: TezosToolkit;
}
