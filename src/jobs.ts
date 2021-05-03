import {Crontab} from "./infrastructure/Crontab";
import {StatisticsDependencies} from "./indexers/StatisticsDependencies";
import {EthereumInitialWrapIndexer} from "./indexers/ethereum/EthereumInitialWrapIndexer";
import {EthereumQuorumIndexer} from "./indexers/ethereum/EthereumQuorumIndexer";
import {TezosQuorumIndexer} from "./indexers/tezos/TezosQuorumIndexer";
import {SignatureIndexer} from "./indexers/signatures/SignatureIndexer";

const every15Seconds = "*/15 * * * * *";
const everyMinute = "* * * * *";

export function scheduleJobs(dependencies: StatisticsDependencies): Crontab {
  dependencies.logger.debug("Scheduling jobs");
  const crontab = new Crontab(dependencies);
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), every15Seconds);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new SignatureIndexer(dependencies).index(), everyMinute);
  return crontab;
}
