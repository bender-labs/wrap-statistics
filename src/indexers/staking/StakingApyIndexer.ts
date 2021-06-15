import {StatisticsDependencies} from "../StatisticsDependencies";
import {Logger} from "tslog";
import {DateTime} from "luxon";
import {Knex} from "knex";
import tokenList from "../../domain/TokenList";
import {NotionalUsdRepository} from "../../repositories/NotionalUsdRepository";
import {WrapIndexer} from "../../facades/WrapIndexer";
import BigNumber from "bignumber.js";
import {WrapXtzPriceRepository} from "../../repositories/WrapXtzPriceRepository";
import {StakingApy} from "../../domain/StakingApy";
import {StakingApyRepository} from "../../repositories/StakingApyRepository";

export class StakingApyIndexer {

  constructor({logger, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._wrapIndexer = new WrapIndexer();
    this._notionalUsdRepository = new NotionalUsdRepository(dbClient);
    this._wrapPriceRepository = new WrapXtzPriceRepository(dbClient)
    this._stakingApyRepository = new StakingApyRepository(dbClient);
    this._dbClient = dbClient;
  }

  async index(): Promise<void> {
    this._logger.debug("Indexing staking apy");
    let transaction;
    try {
      const currentWrapPriceInUsd = await this._wrapPrice();
      const wrapPrecision = this._wrapPrecision();
      const contracts = await this._wrapIndexer.getStakingContractsData(this._logger);
      const result: Array<StakingApy> = [];
      for (const contract of contracts) {
        const currentAvailableRewards = new BigNumber(contract.totalRewards).shiftedBy(-contract.token.decimals);
        const rewardsPrice = await this._rewardsPrice(contract.token.ethereumSymbol, currentWrapPriceInUsd);
        const totalWrapStaked = new BigNumber(contract.totalStaked).shiftedBy(-wrapPrecision);
        const apy = await this._calculateApy(currentAvailableRewards, rewardsPrice, totalWrapStaked, currentWrapPriceInUsd);
        result.push({
          asset: contract.token.ethereumSymbol,
          apy: apy.toString(10),
          totalRewards: currentAvailableRewards.toString(10),
          totalRewardsInUsd: currentAvailableRewards.multipliedBy(rewardsPrice).toString(10),
          totalStaked: totalWrapStaked.toString(10),
          totalStakedInUsd: totalWrapStaked.multipliedBy(currentWrapPriceInUsd).toString(10),
          startLevel: contract.startLevel,
          startTimestamp: contract.startTimestamp,
          farmingContract: contract.farmingContract,
          duration: contract.duration,
        });
      }
      transaction = await this._dbClient.transaction();
      await this._stakingApyRepository.saveAll(result, transaction);
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Error building staking apy: ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }

  private async _calculateApy(currentAvailableRewards: BigNumber, rewardsPrice: BigNumber, totalWrapStaked: BigNumber, currentWrapPriceInUsd: BigNumber): Promise<BigNumber> {
    return currentAvailableRewards
      .multipliedBy(rewardsPrice)
      .dividedBy(
        totalWrapStaked.multipliedBy(currentWrapPriceInUsd)
      ).plus(1).exponentiatedBy(52).minus(1).multipliedBy(100);
  }

  private async _rewardsPrice(token: string, currentWrapPriceInUsd: BigNumber) {
    if (token === "WRAP") {
      return currentWrapPriceInUsd;
    }
    const notional = await this._notionalUsdRepository.find(token, DateTime.now().toMillis());
    return new BigNumber(notional ? notional.value : "0");
  }

  private _wrapPrecision(): number {
    return tokenList.find(t => t.tezosSymbol === "WRAP").decimals;
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
  private _stakingApyRepository: StakingApyRepository;
  private _dbClient: Knex;
}
