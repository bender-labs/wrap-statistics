import {scheduleJobs} from "./jobs";
import {createLogger} from "./infrastructure/logger";
import {loadConfiguration} from "./configuration";
import {createDbClient} from "./infrastructure/dbClient";
import {StatisticsDependencies} from "./indexers/StatisticsDependencies";
import {createEthereumProvider} from "./infrastructure/ethereum/ethereumNetworkProvider";
import {createTezosToolkit} from "./infrastructure/tezos/toolkitProvider";
import * as dotenv from "dotenv";
import {httpServer} from "./web/Server";
import {createIpfsClient} from './infrastructure/ipfsClient';

dotenv.config();

const configuration = loadConfiguration();

const dependencies: StatisticsDependencies = {
  logger: createLogger(configuration),
  ethereumConfiguration: configuration.ethereum,
  ethereumProvider: createEthereumProvider(configuration.ethereum.rpc),
  dbClient: createDbClient(configuration),
  tezosConfiguration: configuration.tezos,
  tezosToolkit: createTezosToolkit(configuration.tezos.rpc),
  ipfsClient: createIpfsClient(configuration)
};

const crontab = scheduleJobs(dependencies);
crontab.start();

const server = httpServer(dependencies).listen(configuration.http.port, () => {
  dependencies.logger.info(
    `Express server started on port: ${configuration.http.port}`
  );
});

process.on("SIGTERM", () => {
  dependencies.logger.info("Server stopping...");
  crontab.stop();
  server.stop();
  process.exit(0);
});
