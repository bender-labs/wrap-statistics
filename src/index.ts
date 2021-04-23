import {scheduleJobs} from "./jobs";
import {createLogger} from "./infrastructure/logger";
import {loadConfiguration} from "./configuration";
import {createDbClient} from "./infrastructure/dbClient";
import {IndexerDependencies} from "./indexers/IndexerDependencies";
import {createEthereumProvider} from "./infrastructure/ethereum/ethereumNetworkProvider";

const configuration = loadConfiguration();

const ethereumConfiguration =
  configuration.ethereum.networks[configuration.ethereum.currentNetwork];

const dependencies: IndexerDependencies = {
  logger: createLogger(configuration),
  dbClient: createDbClient(configuration),
  ethereumConfiguration: ethereumConfiguration,
  ethereumProvider: createEthereumProvider(ethereumConfiguration)
};

const crontab = scheduleJobs(dependencies);
crontab.start();

process.on("SIGTERM", () => {
  dependencies.logger.info("Server stopping...");
  crontab.stop();
  process.exit(0);
});
