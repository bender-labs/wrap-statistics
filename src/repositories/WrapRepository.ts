import {Knex} from 'knex';
import {ERCWrap} from '../domain/ERCWrap';

export class WrapRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrap: ERCWrap, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('wraps').transacting(transaction).insert(wrap);
  }

  // async setStatus(
  //   blockHash: string,
  //   logIndex: number,
  //   status: WrapStatus,
  //   level: number,
  //   transaction: Knex.Transaction
  // ): Promise<void> {
  //   await this._dbClient
  //     .table('wraps')
  //     .transacting(transaction)
  //     .where({
  //       blockHash,
  //       logIndex,
  //     })
  //     .update({status, finalizedAtLevel: level});
  // }
  //
  // async getNotFinalized(): Promise<ERCWrap[]> {
  //   return this._dbClient.table<ERCWrap>('wraps').where({status: 'asked'});
  // }
  //
  // async getFinalizedUntilLevel(level: number): Promise<ERCWrap[]> {
  //   return this._dbClient
  //     .table<ERCWrap>('wraps')
  //     .where({status: 'finalized'})
  //     .andWhere('finalized_at_level', '>=', level);
  // }
  //
  // async getByTransactionHash(transactionHash: string): Promise<ERCWrap[]> {
  //   return this._dbClient.table<ERCWrap>('wraps').where({transactionHash});
  // }
  //
  // async remove(wraps: ERCWrap[], transaction: Knex.Transaction): Promise<void> {
  //   for (const wrap of wraps) {
  //     await this._dbClient
  //       .table('wraps')
  //       .transacting(transaction)
  //       .where({id: wrap.id})
  //       .delete();
  //   }
  // }

  async isExist(
    wrap: ERCWrap,
    transaction: Knex.Transaction
  ): Promise<boolean> {
    const count = await this._dbClient
      .table('wraps')
      .transacting(transaction)
      .where({id: wrap.id})
      .count();
    return count[0].count !== '0';
  }

  private _dbClient: Knex;
}
