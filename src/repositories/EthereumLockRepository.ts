import {Knex} from 'knex';
import {EthereumLock} from '../domain/events/EthereumLock';
import {Token} from "../domain/Token";

export type LockAggregatedResult = {
  ethereumSymbol: string;
  value: string;
}

export class EthereumLockRepository {

  private _dbClient: Knex;

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrap: EthereumLock, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('locks').transacting(transaction).insert(wrap);
  }

  async isExist(
    wrap: EthereumLock,
    transaction: Knex.Transaction
  ): Promise<boolean> {
    const count = await this._dbClient
      .table('locks')
      .transacting(transaction)
      .where({id: wrap.id})
      .count();
    return count[0].count !== '0';
  }

  async sumToken(token: Token, currentTimestamp: number): Promise<string> {
    const result = await this._dbClient('locks')
      .where("ethereumSymbol", token.ethereumSymbol)
      .andWhere("ethereumTimestamp", "<", currentTimestamp)
      .sum("amount");

    return result[0]["sum"] ? result[0]["sum"] : "0";
  }

  async sumAll(currentTimestamp: number): Promise<LockAggregatedResult[]> {
    const result = await this._dbClient('locks')
      .select('ethereumSymbol')
      .where("ethereumTimestamp", "<", currentTimestamp)
      .sum("amount")
      .groupBy('ethereumSymbol');
    return result.map(r => ({
      ethereumSymbol: r.ethereumSymbol,
      value: r.sum ? r.sum : "0"
    }));
  }
}
