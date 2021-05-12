import {Knex} from 'knex';
import {WrapXtzPrice} from "../domain/WrapXtzPrice";

export class WrapXtzPriceRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(price: WrapXtzPrice, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("wrap_price")
      .transacting(transaction)
      .insert(price);
  }

  async find(currentTimestamp: number): Promise<WrapXtzPrice> {
    return this._dbClient.first("*").from<WrapXtzPrice>("wrap_price")
      .where("timestamp", "<", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  private _dbClient: Knex;
}
