import {Crontab} from "./infrastructure/Crontab";
import {StatisticsDependencies} from "./indexers/StatisticsDependencies";
import {EthereumInitialWrapIndexer} from "./indexers/ethereum/EthereumInitialWrapIndexer";
import {EthereumQuorumIndexer} from "./indexers/ethereum/EthereumQuorumIndexer";
import {TezosQuorumIndexer} from "./indexers/tezos/TezosQuorumIndexer";
import {SignatureIndexer} from "./indexers/signatures/SignatureIndexer";
import {EthereumFinalUnwrapIndexer} from "./indexers/ethereum/EthereumFinalUnwrapIndexer";
import {TotalValueLockedBuilder} from "./projections/TotalValueLockedBuilder";
import {NotionalUsdIndexer} from "./indexers/notional/NotionalUsdIndexer";
import {WrapXtzPriceIndexer} from "./indexers/wrap/WrapXtzPriceIndexer";
import {WrapUsdVolumeBuilder} from "./projections/WrapUsdVolumeBuilder";
import {RewardsBuilder} from "./projections/RewardsBuilder";
import {StakingApyIndexer} from "./indexers/staking/StakingApyIndexer";
import {LiquidityMiningPoolsIndexer} from "./indexers/liquidity/LiquidityMiningPoolsIndexer";
import {WrapTokenUsdPriceBuilder} from "./projections/WrapTokenUsdPriceBuilder";
import {WrapTokenTotalSupplyIndexer} from "./indexers/wrap/WrapTokenTotalSupplyIndexer";
import {WrapTokenMarketcapBuilder} from "./projections/WrapTokenMarketcapBuilder";
import {StackingApyIndexer} from "./indexers/stacking/StackingApyIndexer";

const everyMinute = "* * * * *";
const every5Minutes = "*/5 * * * *";
const everyHourAt3 = "3 * * * *";

export function scheduleJobs(dependencies: StatisticsDependencies): Crontab {
  dependencies.logger.debug("Scheduling jobs");
  const crontab = new Crontab(dependencies);
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new SignatureIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new EthereumFinalUnwrapIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new WrapXtzPriceIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new NotionalUsdIndexer(dependencies).index(), everyHourAt3, true);
  crontab.register(() => new StakingApyIndexer(dependencies).index(), every5Minutes, true);
  crontab.register(() => new StackingApyIndexer(dependencies).index(), every5Minutes, true);
  crontab.register(() => new LiquidityMiningPoolsIndexer(dependencies).index(), every5Minutes, true);
  crontab.register(() => new WrapTokenTotalSupplyIndexer(dependencies).index(), every5Minutes, true);
  crontab.register(() => new TotalValueLockedBuilder(dependencies).build(), every5Minutes, true);
  crontab.register(() => new WrapUsdVolumeBuilder(dependencies).build(), every5Minutes, true);
  crontab.register(() => new RewardsBuilder(dependencies).build(), every5Minutes, true);
  crontab.register(() => new WrapTokenUsdPriceBuilder(dependencies).build(), every5Minutes, true);
  crontab.register(() => new WrapTokenMarketcapBuilder(dependencies).build(), every5Minutes, true);
  return crontab;
}
