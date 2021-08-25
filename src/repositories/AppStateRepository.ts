import {Knex} from 'knex';

interface AppStateItem {
  key: string;
  value: string;
}

export class AppStateRepository {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async getGlobalIndexingTimestamp(): Promise<number> {
    const ethereumWrapLastIndexedBlockTimestamp = await this.getEthereumWrapLastIndexedBlockTimestamp() ?? 0;
    const ethereumUnwrapLastIndexedBlockTimestamp = await this.getEthereumUnwrapLastIndexedBlockTimestamp() ?? 0;
    const lastNotionalIndexingTimestamp = await this.getLastNotionalIndexingTimestamp() ?? 0;
    return Math.min((ethereumWrapLastIndexedBlockTimestamp * 1000), (ethereumUnwrapLastIndexedBlockTimestamp * 1000), lastNotionalIndexingTimestamp);
  }

  async getValue(key: string): Promise<number> {
    const item = await this._getValue(key);
    return item ? +item.value : null;
  }

  async setValue(key: string, timestamp: number, transaction: Knex.Transaction): Promise<void> {
    await this._setValue(
      {key: key, value: timestamp.toString()},
      transaction
    );
  }

  async getLastRewardsBuildTimestamp(): Promise<number> {
    const item = await this._getValue('last_rewards_build_timestamp');
    return item ? +item.value : null;
  }

  async setLastRewardsBuildTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_rewards_build_timestamp', value: timestamp.toString()},
      transaction
    );
  }

  async getLastWrappingUsdVolumeBuildTimestamp(): Promise<number> {
    const item = await this._getValue('last_wrapping_usd_volume_build_timestamp');
    return item ? +item.value : null;
  }

  async setLastWrappingUsdVolumeBuildTimestamp(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_wrapping_usd_volume_build_timestamp', value: timestamp.toString()},
      transaction
    );
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

  async getLastWrapTokenTotalSupplyIndexedLevel(): Promise<number | null> {
    const item = await this._getValue('last_wrap_token_total_supply_level');
    return item ? +item.value : null;
  }

  async setLastWrapTokenTotalSupplyIndexedLevel(
    level: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_wrap_token_total_supply_level', value: level.toString()},
      transaction
    );
  }

  async getLastWrapTokenUsdPrice(): Promise<number | null> {
    const item = await this._getValue('last_wrap_token_usd_price');
    return item ? +item.value : null;
  }

  async setLastWrapTokenUsdPrice(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_wrap_token_usd_price', value: timestamp.toString()},
      transaction
    );
  }

  async getLastWrapTokenMarketcap(): Promise<number | null> {
    const item = await this._getValue('last_wrap_token_marketcap');
    return item ? +item.value : null;
  }

  async setLastWrapTokenMarketcap(
    timestamp: number,
    transaction: Knex.Transaction
  ): Promise<void> {
    await this._setValue(
      {key: 'last_wrap_token_marketcap', value: timestamp.toString()},
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
