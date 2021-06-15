import {Knex} from 'knex';
import {StakingApy} from "../domain/StakingApy";

export class StakingApyRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async saveAll(apys: Array<StakingApy>, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("staking_apy")
      .delete();
    await this._dbClient
      .table("staking_apy")
      .transacting(transaction)
      .insert(apys);
  }

  async findAll(): Promise<Array<StakingApy>> {
    return this._dbClient.table("staking_apy");
  }

  private _dbClient: Knex;
}
