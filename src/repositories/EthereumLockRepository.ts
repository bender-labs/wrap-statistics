import {Knex} from 'knex';
import {EthereumLock} from '../domain/EthereumLock';

export class EthereumLockRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrap: EthereumLock, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('locks').transacting(transaction).insert(wrap);
  }

  async isExist(
    wrap: EthereumLock,
    transaction: Knex.Transaction
  ): Promise<boolean> {
    const count = await this._dbClient
      .table('locks')
      .transacting(transaction)
      .where({id: wrap.id})
      .count();
    return count[0].count !== '0';
  }

  private _dbClient: Knex;
}
