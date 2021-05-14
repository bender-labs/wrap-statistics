import {Knex} from 'knex';
import {NotionalUsd} from "../domain/NotionalUsd";

export class NotionalUsdRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(notionalUsd: NotionalUsd, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("notional_usd")
      .transacting(transaction)
      .insert(notionalUsd);
  }

  async find(asset: string, currentTimestamp: number): Promise<NotionalUsd> {
    return this._dbClient.first("*").from<NotionalUsd>("notional_usd")
      .where({asset: asset})
      .andWhere("timestamp", "<=", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  async findAll(currentTimestamp: number): Promise<NotionalUsd[]> {
    const result = await this._dbClient.raw('select t1.* ' +
      'from notional_usd as t1 inner join ' +
      '(select max(timestamp) as timestamp, asset ' +
      'from notional_usd ' +
      'where timestamp <= ? ' +
      'group by asset) as t2 on t1.timestamp = t2.timestamp and t1.asset = t2.asset', [currentTimestamp]);
    return result.rows as NotionalUsd[];
  }

  private _dbClient: Knex;
}
