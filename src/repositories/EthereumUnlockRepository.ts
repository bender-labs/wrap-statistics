import {Knex} from 'knex';
import {EthereumUnlock} from '../domain/events/EthereumUnlock';

export type UnlockAggregatedResult = {
  ethereumSymbol: string;
  value: string;
}

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

  async sumAll(currentTimestamp: number): Promise<UnlockAggregatedResult[]> {
    const result = await this._dbClient('unlocks')
      .select('ethereumSymbol')
      .where("ethereumTimestamp", "<=", currentTimestamp)
      .andWhere("success", true)
      .sum("amount")
      .groupBy('ethereumSymbol');
    return result.map(r => ({
      ethereumSymbol: r.ethereumSymbol,
      value: r.sum ? r.sum : "0"
    }));
  }

  private _dbClient: Knex;
}
