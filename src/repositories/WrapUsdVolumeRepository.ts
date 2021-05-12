import {Knex} from 'knex';
import {WrapUsdVolume} from "../domain/projections/WrapUsdVolume";
import {WrapUsdVolumeDto} from "../web/dto/WrapUsdVolumeDto";

export class WrapUsdVolumeRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrapUsdVolume: WrapUsdVolume, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("wrap_usd_volume")
      .transacting(transaction)
      .insert(wrapUsdVolume)
      .onConflict(["start", "end", "asset"]).merge();
  }

  async find(start: number, end: number): Promise<WrapUsdVolumeDto[]> {
    const results = await this._dbClient("wrap_usd_volume").where({"start": start, "end": end});
    return results.map(r => ({
      asset: r.asset,
      value: r.value
    }));
  }

  private _dbClient: Knex;
}
