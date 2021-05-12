import {Knex} from 'knex';
import {TotalValueLocked} from "../domain/TotalValueLocked";

export class TvlRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(tvl: TotalValueLocked, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("tvl")
      .transacting(transaction)
      .insert(tvl);
  }

  async find(asset: string, currentTimestamp: number): Promise<TotalValueLocked> {
    return this._dbClient.first("*").from<TotalValueLocked>("tvl")
      .where({asset: asset})
      .andWhere("timestamp", "<", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  async findAll(currentTimestamp: number): Promise<TotalValueLocked[]> {
    const result = await this._dbClient.raw('select t1.* ' +
      'from tvl as t1 inner join ' +
      '(select max(timestamp) as timestamp, asset ' +
      'from tvl ' +
      'where timestamp < ? ' +
      'group by asset) as t2 on t1.timestamp = t2.timestamp and t1.asset = t2.asset', [currentTimestamp]);
    return result.rows as TotalValueLocked[];
  }

  private _dbClient: Knex;
}
