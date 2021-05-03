import {Knex} from 'knex';
import {Wrap} from "../domain/Wrap";

export class WrapRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrap: Wrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("wraps")
      .transacting(transaction)
      .insert(wrap);
  }

  async find(id: string): Promise<Wrap> {
    return this._dbClient.first("*").from<Wrap>("wraps").where({id: id});
  }

  private _dbClient: Knex;
}
