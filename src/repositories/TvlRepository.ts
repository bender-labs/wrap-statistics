import {Knex} from 'knex';
import {Tvl} from "../domain/Tvl";

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

  private _dbClient: Knex;
}
