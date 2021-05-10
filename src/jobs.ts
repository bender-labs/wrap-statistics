import {Crontab} from "./infrastructure/Crontab";
import {StatisticsDependencies} from "./indexers/StatisticsDependencies";
import {EthereumInitialWrapIndexer} from "./indexers/ethereum/EthereumInitialWrapIndexer";
import {EthereumQuorumIndexer} from "./indexers/ethereum/EthereumQuorumIndexer";
import {TezosQuorumIndexer} from "./indexers/tezos/TezosQuorumIndexer";
import {SignatureIndexer} from "./indexers/signatures/SignatureIndexer";
import {EthereumFinalUnwrapIndexer} from "./indexers/ethereum/EthereumFinalUnwrapIndexer";
import {TotalValueLockedIndexer} from "./indexers/TotalValueLockedIndexer";
import {NotionalUsdIndexer} from "./indexers/NotionalUsdIndexer";
import {WrapPriceIndexer} from "./indexers/wrap/WrapPriceIndexer";

const everyMinute = "* * * * *";
const every15Minutes = "*/15 * * * *";

export function scheduleJobs(dependencies: StatisticsDependencies): Crontab {
  dependencies.logger.debug("Scheduling jobs");
  const crontab = new Crontab(dependencies);
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new SignatureIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new EthereumFinalUnwrapIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new NotionalUsdIndexer(dependencies).index(), every15Minutes);
  crontab.register(() => new TotalValueLockedIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new WrapPriceIndexer(dependencies).index(), every15Minutes);
  return crontab;
}
