import {Logger} from "tslog";
import {Knex} from "knex";
import {EthereumConfig, TezosConfig} from "../configuration";
import {ethers} from "ethers";
import {TezosToolkit} from "@taquito/taquito";

export type StatisticsDependencies = {
  logger: Logger;
  dbClient: Knex;
  ethereumConfiguration: EthereumConfig;
  ethereumProvider: ethers.providers.Provider;
  tezosConfiguration: TezosConfig;
  tezosToolkit: TezosToolkit;
}
