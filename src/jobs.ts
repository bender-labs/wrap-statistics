import {Crontab} from "./infrastructure/Crontab";
import {IndexerDependencies} from "./indexers/IndexerDependencies";
import {EthereumInitialWrapIndexer} from "./indexers/ethereum/EthereumInitialWrapIndexer";
import {EthereumQuorumIndexer} from "./indexers/ethereum/EthereumQuorumIndexer";
import {TezosQuorumIndexer} from "./indexers/tezos/TezosQuorumIndexer";

const every10Seconds = "*/15 * * * * *";
const everyMinute = "* * * * *";

export function scheduleJobs(dependencies: IndexerDependencies): Crontab {
  dependencies.logger.debug("Scheduling jobs");
  const crontab = new Crontab();
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), every10Seconds);
  crontab.register(() => new EthereumQuorumIndexer(dependencies).index(), everyMinute);
  crontab.register(() => new TezosQuorumIndexer(dependencies).index(), everyMinute);
  return crontab;
}
