import {Knex} from 'knex';

interface AppStateItem {
  key: string;
  value: string;
}

export class AppState {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async getLastTvlIndexingTimestamp(): Promise<number> {
    const item = await this._getValue('last_tvl_indexing_timestamp');
    return item ? +item.value : null;
  }

  async setLastTvlIndexingTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_tvl_indexing_timestamp', value: timestamp.toString()},
      transaction
    );
  }

  async getLastNotionalIndexingTimestamp(): Promise<number> {
    const item = await this._getValue('last_notional_indexing_timestamp');
    return item ? +item.value : null;
  }

  async setLastNotionalIndexingTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_notional_indexing_timestamp', value: timestamp.toString()},
      transaction
    );
  }

  async getLastUsdXtzIndexingTimestamp(): Promise<number> {
    const item = await this._getValue('last_usd_xtz_indexing_timestamp');
    return item ? +item.value : null;
  }

  async setLastUsdXtzIndexingTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_usd_xtz_indexing_timestamp', value: timestamp.toString()},
      transaction
    );
  }

  async getEthereumWrapLastIndexedBlockNumber(): Promise<number | null> {
    const item = await this._getValue('ethereum_wrap_last_indexed_block');
    return item ? +item.value : null;
  }

  async setEthereumWrapLastIndexedBlockNumber(
    block: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'ethereum_wrap_last_indexed_block', value: block.toString()},
      transaction
    );
  }

  async getEthereumWrapLastIndexedBlockTimestamp(): Promise<number | null> {
    const item = await this._getValue('ethereum_wrap_last_indexed_block_timestamp');
    return item ? +item.value : null;
  }

  async setEthereumWrapLastIndexedBlockTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'ethereum_wrap_last_indexed_block_timestamp', value: timestamp.toString()},
      transaction
    );
  }

  async getEthereumUnwrapLastIndexedBlockNumber(): Promise<number | null> {
    const item = await this._getValue('ethereum_unwrap_last_indexed_block');
    return item ? +item.value : null;
  }

  async setEthereumUnwrapLastIndexedBlockNumber(
    lastId: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'ethereum_unwrap_last_indexed_block', value: lastId.toString()},
      transaction
    );
  }

  async getEthereumUnwrapLastIndexedBlockTimestamp(): Promise<number | null> {
    const item = await this._getValue('ethereum_unwrap_last_indexed_block_timestamp');
    return item ? +item.value : null;
  }

  async setEthereumUnwrapLastIndexedBlockTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'ethereum_unwrap_last_indexed_block_timestamp', value: timestamp.toString()},
      transaction
    );
  }

  async getLastIndexedSignature(ipnsKey: string): Promise<string | null> {
    const item = await this._getValue(`${ipnsKey}_signature_last_indexed`);
    return item ? item.value : null;
  }

  async setLastIndexedSignature(
    ipnsKey: string,
    signature: string,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: `${ipnsKey}_signature_last_indexed`, value: signature},
      transaction
    );
  }

  async getLastQuipuswapIndexedLevel(): Promise<number | null> {
    const item = await this._getValue('last_quipuswap_indexed_level');
    return item ? +item.value : null;
  }

  async setLastQuipuswapIndexedLevel(
    level: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_quipuswap_indexed_level', value: level.toString()},
      transaction
    );
  }

  async _getValue(key: string): Promise<AppStateItem | null> {
    return this._dbClient
      .table<AppStateItem>('app_state')
      .where({key})
      .first();
  }

  async _setValue(
    item: AppStateItem,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._dbClient
      .table<AppStateItem>('app_state')
      .transacting(transaction)
      .insert(item)
      .onConflict('key' as never)
      .merge(item);
  }

  private _dbClient: Knex;
}
