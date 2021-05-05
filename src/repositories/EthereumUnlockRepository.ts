import {Knex} from 'knex';
import {EthereumUnlock} from '../domain/events/EthereumUnlock';

export class EthereumUnlockRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(ethereumUnlock: EthereumUnlock, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('unlocks').transacting(transaction).insert(ethereumUnlock);
  }

  async isExist(
    ethereumUnlock: EthereumUnlock,
    transaction: Knex.Transaction
  ): Promise<boolean> {
    const count = await this._dbClient
      .table('unlocks')
      .transacting(transaction)
      .where({id: ethereumUnlock.id})
      .count();
    return count[0].count !== '0';
  }

  private _dbClient: Knex;
}
