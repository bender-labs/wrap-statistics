import {Crontab} from "./infrastructure/Crontab";
import {IndexerDependencies} from "./indexers/IndexerDependencies";
import {EthereumInitialWrapIndexer} from "./indexers/EthereumInitialWrapIndexer";

const every10Seconds = "*/10 * * * * *";

export function scheduleJobs(dependencies: IndexerDependencies): Crontab {
  dependencies.logger.debug("Scheduling jobs");
  const crontab = new Crontab();
  crontab.register(() => new EthereumInitialWrapIndexer(dependencies).index(), every10Seconds);
  return crontab;
}
