import {Logger} from 'tslog';
import {EthereumConfig} from '../../configuration';
import {Knex} from 'knex';
import {ethers} from 'ethers';
import {EthereumQuorumRepository} from '../../repositories/EthereumQuorumRepository';
import {StatisticsDependencies} from "../StatisticsDependencies";

export class EthereumQuorumIndexer {

  private _logger: Logger;
  private _ethereumConfig: EthereumConfig;
  private _ethereumProvider: ethers.providers.Provider;
  private _dbClient: Knex;

  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
    this._ethereumConfig = dependencies.ethereumConfiguration;
    this._dbClient = dependencies.dbClient;
    this._ethereumProvider = dependencies.ethereumProvider;
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing ethereum quorum`);

    let transaction;

    try {
      const contract = new ethers.Contract(
        this._ethereumConfig.wrapContractAddress,
        this._ethereumConfig.wrapABI,
        this._ethereumProvider
      );
      const administrator = await contract.getAdministrator();
      const threshold = await contract.getThreshold();
      const signers = await contract.getOwners();

      transaction = await this._dbClient.transaction();
      await new EthereumQuorumRepository(this._dbClient).save(
        {
          admin: administrator,
          threshold: threshold.toNumber(),
          signers,
        },
        transaction
      );
      await transaction.commit();
    } catch (e) {
      this._logger.error(`Can't process ethereum quorum ${e.message}`);
      if (transaction) {
        transaction.rollback();
      }
    }
  }
}
