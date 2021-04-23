import {Logger} from "tslog";
import {Knex} from "knex";
import {EthereumConfig} from "../configuration";
import {ethers} from "ethers";

export type IndexerDependencies = {
  logger: Logger;
  dbClient: Knex;
  ethereumConfiguration: EthereumConfig;
  ethereumProvider: ethers.providers.Provider;
}
