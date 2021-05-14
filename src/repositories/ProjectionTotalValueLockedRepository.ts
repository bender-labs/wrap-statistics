import {Knex} from 'knex';
import {ProjectionTotalValueLocked} from "../domain/projections/ProjectionTotalValueLocked";

export class ProjectionTotalValueLockedRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(tvl: ProjectionTotalValueLocked, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("projection_total_value_locked")
      .transacting(transaction)
      .insert(tvl);
  }

  async find(asset: string, currentTimestamp: number): Promise<ProjectionTotalValueLocked> {
    return this._dbClient.first("*").from<ProjectionTotalValueLocked>("projection_total_value_locked")
      .where({asset: asset})
      .andWhere("timestamp", "<=", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  async findAll(currentTimestamp: number): Promise<ProjectionTotalValueLocked[]> {
    const result = await this._dbClient.raw('select t1.* ' +
      'from projection_total_value_locked as t1 inner join ' +
      '(select max(timestamp) as timestamp, asset ' +
      'from projection_total_value_locked ' +
      'where timestamp <= ? ' +
      'group by asset) as t2 on t1.timestamp = t2.timestamp and t1.asset = t2.asset', [currentTimestamp]);
    return result.rows as ProjectionTotalValueLocked[];
  }

  private _dbClient: Knex;
}
