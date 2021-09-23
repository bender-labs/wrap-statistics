import {Knex} from 'knex';
import {StackingApy} from "../domain/StackingApy";

export class StackingApyRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async saveAll(apys: Array<StackingApy>, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("stacking_apy")
      .delete();
    await this._dbClient
      .table("stacking_apy")
      .transacting(transaction)
      .insert(apys);
  }

  async findAll(): Promise<Array<StackingApy>> {
    return this._dbClient.table("stacking_apy");
  }

  private _dbClient: Knex;
}
