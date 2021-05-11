import {Knex} from 'knex';
import {WrapPrice} from "../domain/WrapPrice";

export class WrapPriceRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(price: WrapPrice, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("wrap_price")
      .transacting(transaction)
      .insert(price);
  }

  async find(currentTimestamp: number): Promise<WrapPrice> {
    return this._dbClient.first("*").from<WrapPrice>("wrap_price")
      .where("timestamp", "<", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  private _dbClient: Knex;
}
