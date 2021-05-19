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

    const lastWrapTimestamp = await this._getLastWrapIndexedTimestamp() ?? 0;
    const lastUnwrapTimestamp = await this._getLastUnwrapIndexedTimestamp() ?? 0;

    let currentIndexingTimeMs = await this._getLastRewardsBuildTimestamp();

    while (currentIndexingTimeMs < nowMs && currentIndexingTimeMs < (lastWrapTimestamp * 1000) && currentIndexingTimeMs < (lastUnwrapTimestamp * 1000)) {
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        this._logger.debug("building rewards @ " + currentIndexingTimeMs);
        await this._buildWeekRewardsFor(currentIndexingTimeMs, transaction);
        await this._setLastRewardsBuildTimestamp(currentIndexingTimeMs, transaction);
        await transaction.commit();
        currentIndexingTimeMs = DateTime.fromMillis(currentIndexingTimeMs).plus({"hours": 1}).toMillis();
      } catch (e) {
        this._logger.error(`Error building rewards : ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _getLastWrapIndexedTimestamp(): Promise<number> {
    return await this._appStateRepository.getEthereumWrapLastIndexedBlockTimestamp();
  }

  private async _getLastUnwrapIndexedTimestamp(): Promise<number> {
    return await this._appStateRepository.getEthereumUnwrapLastIndexedBlockTimestamp();
  }

  private async _setLastRewardsBuildTimestamp(lastTimestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._appStateRepository.setLastRewardsBuildTimestamp(lastTimestamp, transaction);
  }

  private async _getLastRewardsBuildTimestamp(): Promise<number> {
    return await this._appStateRepository.getLastRewardsBuildTimestamp() ?? BenderTime.startMs;
  }

  private async _buildWeekRewardsFor(currentIndexingTimeMs: number, transaction: Knex.Transaction): Promise<void> {
    const currentWeekInterval = this._benderTime.getBenderWeekFor(currentIndexingTimeMs);
    const startWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAllByAddressAndToken(currentWeekInterval.start.toMillis());
    const endWrappingVolumeForAllTokens = await this._ethereumLockRepository.sumAllByAddressAndToken(currentWeekInterval.end.toMillis());

    for (const token of tokenList) {
      if (token.allocation > 0) {
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
    const addressReward = new BigNumber(addressVolume).multipliedBy(totalRewardForToken).dividedBy(totalTokenWrapVolumeOnPeriod);

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
