import {Knex} from 'knex';
import {MintingFailedEvent, UnwrapSignature, WrapSignature} from '../domain/events/Signature';

export class SignatureRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(
    signature: WrapSignature | UnwrapSignature | MintingFailedEvent,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table('signatures')
      .transacting(transaction)
      .insert(signature);
  }

  private _dbClient: Knex;
}
