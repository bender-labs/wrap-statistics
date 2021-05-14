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
import {XtzUsdIndexer} from "./indexers/notional/XtzUsdIndexer";
import {WrapUsdVolumeBuilder} from "./projections/WrapUsdVolumeBuilder";

const everyMinute = "* * * * *";
const every5Minutes = "*/5 * * * *";

export function scheduleJobs(dependencies: StatisticsDependencies): Crontab {
  dependencies.logger.debug("Scheduling jobs");
  const crontab = new Crontab(dependencies);
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new SignatureIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new EthereumFinalUnwrapIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new NotionalUsdIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new XtzUsdIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new WrapXtzPriceIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new TotalValueLockedBuilder(dependencies).build(), every5Minutes);
  crontab.register(() => new WrapUsdVolumeBuilder(dependencies).build(), every5Minutes);
  return crontab;
}
