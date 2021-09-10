import {Logger} from "tslog";
import {Knex} from "knex";
import {AppStateRepository} from "../repositories/AppStateRepository";
import {StatisticsDependencies} from "../indexers/StatisticsDependencies";
import {BenderTime} from "../domain/BenderTime";
import {DateTime, Interval} from "luxon";
import {ProjectionRewardsRepository} from "../repositories/ProjectionRewardsRepository";
import {EthereumLockRepository, LockAggregatedResultWithAddress} from "../repositories/EthereumLockRepository";
import tokenList from "../domain/TokenList";
import BigNumber from "bignumber.js";
import {Token} from "../domain/Token";
import {getTokenRewardForPeriod} from "../domain/Rewards";

export class RewardsBuilder {

  constructor({logger, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._dbClient = dbClient;
    this._appStateRepository = new AppStateRepository(dbClient);
    this._benderTime = new BenderTime();
    this._ethereumLockRepository = new EthereumLockRepository(dbClient);
    this._projectionRewardsRepository = new ProjectionRewardsRepository(dbClient);
  }

  async build(): Promise<void> {
    this._logger.debug("building rewards");
    const nowMs = DateTime.utc().toMillis();

    const globalIndexingTimestamp = await this._appStateRepository.getGlobalIndexingTimestamp();
    let nextRewardsIndexingTimestamp = DateTime.fromMillis(await this._getLastRewardsBuildTimestamp()).plus({"hours": 1}).toMillis();

    while (nextRewardsIndexingTimestamp < nowMs && nextRewardsIndexingTimestamp < globalIndexingTimestamp) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        this._logger.debug("building rewards @ " + nextRewardsIndexingTimestamp);
        await this._buildWeekRewardsFor(nextRewardsIndexingTimestamp, transaction);
        await this._setLastRewardsBuildTimestamp(nextRewardsIndexingTimestamp, transaction);
        await transaction.commit();
        nextRewardsIndexingTimestamp = DateTime.fromMillis(nextRewardsIndexingTimestamp).plus({"hours": 1}).toMillis();
      } catch (e) {
        this._logger.error(`Error building rewards : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _setLastRewardsBuildTimestamp(lastTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appStateRepository.setLastRewardsBuildTimestamp(lastTimestamp, transaction);
  }

  private async _getLastRewardsBuildTimestamp(): Promise<number> {
    return await this._appStateRepository.getLastRewardsBuildTimestamp() ?? BenderTime.startMs;
  }

  private async _buildWeekRewardsFor(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    const lastIndexedWeek = await this._getLastIndexedWeek();
    const currentWeekToIndex = this._benderTime.getBenderWeekFor(currentIndexingTimeMs);

    if (lastIndexedWeek && !lastIndexedWeek.start.equals(currentWeekToIndex.start)) {
      await this._buildWeekRewardsForAllTokens(lastIndexedWeek, transaction);
    }

    await this._buildWeekRewardsForAllTokens(currentWeekToIndex, transaction);
    await this._setLastIndexedWeek(currentWeekToIndex, transaction);
  }

  private async _getLastIndexedWeek(): Promise<Interval> {
    const lastWeekStartTimestamp = await this._appStateRepository.getValue("rewards_last_week_start");
    const lastWeekEndTimestamp = await this._appStateRepository.getValue("rewards_last_week_end");
    return lastWeekStartTimestamp && lastWeekEndTimestamp ? Interval.fromDateTimes(DateTime.fromMillis(lastWeekStartTimestamp), DateTime.fromMillis(lastWeekEndTimestamp)) : null;
  }

  private async _setLastIndexedWeek(indexedWeek: Interval, transaction: Knex.Transaction): Promise<void> {
    await this._appStateRepository.setValue("rewards_last_week_start", indexedWeek.start.toMillis(), transaction);
    await this._appStateRepository.setValue("rewards_last_week_end", indexedWeek.end.toMillis(), transaction);
  }

  private async _buildWeekRewardsForAllTokens(currentWeekInterval: Interval, transaction: Knex.Transaction): Promise<void> {
    const startWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAllByAddressAndToken(currentWeekInterval.start.toMillis());
    const endWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAllByAddressAndToken(currentWeekInterval.end.toMillis());

    for (const token of tokenList.filter(t => t.type === "ERC20")) {
      if (token.allocation(currentWeekInterval.start.toMillis()) > 0) {
        await this._buildRewardsForAllAddressesByToken(token, startWrappingVolumeForAllTokens, endWrappingVolumeForAllTokens, currentWeekInterval, transaction);
      }
    }
  }

  private async _buildRewardsForAllAddressesByToken(token: Token, startWrappingVolumeForAllTokens: LockAggregatedResultWithAddress[], endWrappingVolumeForAllTokens: LockAggregatedResultWithAddress[], currentWeekInterval: Interval, transaction: Knex.Transaction) {
    const allStartWrapsForToken = this._getAllWrapsForToken(token, startWrappingVolumeForAllTokens);
    const allEndWrapsForToken = this._getAllWrapsForToken(token, endWrappingVolumeForAllTokens);
    const totalTokenWrapVolumeOnPeriod = this._getWrapVolume(allStartWrapsForToken, allEndWrapsForToken);

    for (const endWrapsForAddress of allEndWrapsForToken) {
      const startWrapVolumeForAddress = allStartWrapsForToken.find(s => s.tezosAddress === endWrapsForAddress.tezosAddress) ? allStartWrapsForToken.find(s => s.tezosAddress === endWrapsForAddress.tezosAddress).value : "0";
      const addressVolume = new BigNumber(endWrapsForAddress.value).minus(new BigNumber(startWrapVolumeForAddress));

      if (addressVolume.isGreaterThan(0)) {
        await this._buildRewardsForAddress(currentWeekInterval, addressVolume, totalTokenWrapVolumeOnPeriod, token, endWrapsForAddress, transaction);
      }
    }
  }

  private async _buildRewardsForAddress(currentWeekInterval: Interval, addressVolume: BigNumber, totalTokenWrapVolumeOnPeriod: BigNumber, token: Token, endWrapsForAddress: LockAggregatedResultWithAddress, transaction: Knex.Transaction) {
    const totalRewardForToken = getTokenRewardForPeriod(currentWeekInterval.start.toMillis(), currentWeekInterval.end.toMillis(), token);
    const addressReward = new BigNumber(addressVolume).multipliedBy(totalRewardForToken).dividedBy(totalTokenWrapVolumeOnPeriod).dp(8, BigNumber.ROUND_DOWN);

    await this._projectionRewardsRepository.save({
      start: currentWeekInterval.start.toMillis(),
      end: currentWeekInterval.end.toMillis(),
      asset: token.ethereumSymbol,
      amount: addressVolume.toString(10),
      reward: addressReward.toString(10),
      tezos_address: endWrapsForAddress.tezosAddress
    }, transaction);
  }

  private _getAllWrapsForToken(token: Token, wraps: LockAggregatedResultWithAddress[]): LockAggregatedResultWithAddress[] {
    return wraps.filter(s => s.ethereumSymbol === token.ethereumSymbol);
  }

  private _getWrapVolume(startWraps: LockAggregatedResultWithAddress[], endWraps: LockAggregatedResultWithAddress[]): BigNumber {
    const startWrapVolume = startWraps.reduce((acc: BigNumber, currentWrap: LockAggregatedResultWithAddress) => {
      return acc.plus(new BigNumber(currentWrap.value));
    }, new BigNumber(0));
    const endWrapVolume = endWraps.reduce((acc: BigNumber, currentWrap: LockAggregatedResultWithAddress) => {
      return acc.plus(new BigNumber(currentWrap.value));
    }, new BigNumber(0));
    return endWrapVolume.minus(startWrapVolume);
  }

  private _logger: Logger;
  private readonly _dbClient: Knex;
  private _appStateRepository: AppStateRepository;
  private _benderTime: BenderTime;
  private _ethereumLockRepository: EthereumLockRepository;
  private _projectionRewardsRepository: ProjectionRewardsRepository;
}
