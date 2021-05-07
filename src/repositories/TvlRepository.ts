import {Knex} from 'knex';
import {Tvl} from "../domain/Tvl";
import {NotionalUsd} from "../domain/NotionalUsd";

export class TvlRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(tvl: Tvl, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("tvl")
      .transacting(transaction)
      .insert(tvl);
  }

  async find(asset: string, currentTimestamp: number): Promise<Tvl> {
    return this._dbClient.first("*").from<Tvl>("tvl")
      .where({asset: asset})
      .andWhere("timestamp", "<", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  async findAll(currentTimestamp: number): Promise<Tvl[]> {
    const result = await this._dbClient.raw('select t1.* ' +
      'from tvl as t1 inner join ' +
      '(select max(timestamp) as timestamp, asset ' +
      'from tvl ' +
      'where timestamp < ? ' +
      'group by asset) as t2 on t1.timestamp = t2.timestamp and t1.asset = t2.asset', [currentTimestamp]);
    return result.rows as Tvl[];
  }



  private _dbClient: Knex;
}
