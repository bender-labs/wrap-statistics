import {Knex} from 'knex';
import {WrapXtzPrice} from "../domain/WrapXtzPrice";
import {WrapTokenTotalSupply} from "../domain/WrapTokenTotalSupply";

export class WrapTokenTotalSupplyRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(price: WrapTokenTotalSupply, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("wrap_token_total_supply")
      .transacting(transaction)
      .insert(price);
  }

  async find(currentTimestamp: number): Promise<WrapTokenTotalSupply> {
    return this._dbClient.first("*").from<WrapXtzPrice>("wrap_token_total_supply")
      .where("timestamp", "<", currentTimestamp)
      .orderBy("timestamp", "desc");
  }

  async findByLevel(level: number): Promise<WrapTokenTotalSupply> {
    return this._dbClient.first("*").from<WrapTokenTotalSupply>("wrap_token_total_supply")
      .where({level});
  }

  async last(): Promise<WrapTokenTotalSupply> {
    return this._dbClient.first("*").from<WrapXtzPrice>("wrap_token_total_supply")
      .orderBy("timestamp", "desc");
  }

  private _dbClient: Knex;
}
