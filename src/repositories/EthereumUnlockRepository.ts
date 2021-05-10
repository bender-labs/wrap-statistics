import {Knex} from 'knex';
import {EthereumUnlock} from '../domain/events/EthereumUnlock';
import {Token} from "../domain/Token";

export type UnlockAggregatedResult = {
  ethereumSymbol: string;
  value: string;
}

export class EthereumUnlockRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(ethereumUnlock: EthereumUnlock, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient.table('unlocks').transacting(transaction).insert(ethereumUnlock);
  }

  async isExist(
    ethereumUnlock: EthereumUnlock,
    transaction: Knex.Transaction
  ): Promise<boolean> {
    const count = await this._dbClient
      .table('unlocks')
      .transacting(transaction)
      .where({id: ethereumUnlock.id})
      .count();
    return count[0].count !== '0';
  }

  async sumToken(token: Token, currentTimestamp: number): Promise<string> {
    const result = await this._dbClient('unlocks')
      .where("ethereumSymbol", token.ethereumSymbol)
      .andWhere("success", true)
      .andWhere("ethereumTimestamp", "<", currentTimestamp)
      .sum("amount");

    return result[0]["sum"] ? result[0]["sum"] : "0";
  }

  async sumAll(currentTimestamp: number): Promise<UnlockAggregatedResult[]> {
    const result = await this._dbClient('unlocks')
      .select('ethereumSymbol')
      .where("ethereumTimestamp", "<", currentTimestamp)
      .andWhere("success", true)
      .sum("amount")
      .groupBy('ethereumSymbol');
    return result.map(r => ({
      ethereumSymbol: r.ethereumSymbol,
      value: r.sum ? r.sum : "0"
    }));
  }

  private _dbClient: Knex;
}
