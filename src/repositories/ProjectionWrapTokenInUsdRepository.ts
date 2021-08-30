import {Knex} from 'knex';
import {WrapTokenInUsd} from "../domain/projections/WrapTokenInUsd";

export class ProjectionWrapTokenInUsdRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrapTokenInUsd: WrapTokenInUsd, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("projection_wrap_token_in_usd")
      .transacting(transaction)
      .insert(wrapTokenInUsd);
  }

  async last(): Promise<WrapTokenInUsd> {
    return this._dbClient.first("*").from<WrapTokenInUsd>("projection_wrap_token_in_usd")
      .orderBy("timestamp", "desc");
  }

  async findFrom(timestamp: number): Promise<WrapTokenInUsd[]> {
    return this._dbClient("projection_wrap_token_in_usd")
      .where("timestamp", ">=", timestamp);
  }

  private _dbClient: Knex;
}
