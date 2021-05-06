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
      .andWhere("timestamp", "<", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  private _dbClient: Knex;
}
