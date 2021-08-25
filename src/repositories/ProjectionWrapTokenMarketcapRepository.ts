import {Knex} from 'knex';
import {WrapTokenInUsd} from "../domain/projections/WrapTokenInUsd";

export class ProjectionWrapTokenMarketcapRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrapTokenInUsd: WrapTokenInUsd, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("projection_wrap_token_marketcap")
      .transacting(transaction)
      .insert(wrapTokenInUsd);
  }

  async findFrom(timestamp: number): Promise<WrapTokenInUsd[]> {
    return this._dbClient("projection_wrap_token_marketcap")
      .where("timestamp", ">=", timestamp);
  }

  private _dbClient: Knex;
}
