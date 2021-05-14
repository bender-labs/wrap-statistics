import {Knex} from 'knex';
import {EthereumLock} from '../domain/events/EthereumLock';

export type LockAggregatedResult = {
  ethereumSymbol: string;
  value: string;
}

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

  async sumAll(currentTimestamp: number): Promise<LockAggregatedResult[]> {
    const result = await this._dbClient('locks')
      .select('ethereumSymbol')
      .where("ethereumTimestamp", "<=", currentTimestamp)
      .sum("amount")
      .groupBy('ethereumSymbol');
    return result.map(r => ({
      ethereumSymbol: r.ethereumSymbol,
      value: r.sum ? r.sum : "0"
    }));
  }

  private _dbClient: Knex;
}
