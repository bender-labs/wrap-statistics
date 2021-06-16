import {Knex} from 'knex';
import {LiquidityMiningApy} from "../domain/LiquidityMiningApy";

export class LiquidityMiningApyRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async saveAll(apys: Array<LiquidityMiningApy>, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("liquidity_mining_apy")
      .delete();
    await this._dbClient
      .table("liquidity_mining_apy")
      .transacting(transaction)
      .insert(apys);
  }

  async findAll(): Promise<Array<LiquidityMiningApy>> {
    return this._dbClient.table("liquidity_mining_apy");
  }

  private _dbClient: Knex;
}
