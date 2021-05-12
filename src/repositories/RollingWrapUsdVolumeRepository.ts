import {Knex} from 'knex';
import {RollingWrapUsdVolume} from "../domain/projections/RollingWrapUsdVolume";
import {RollingWrapUsdVolumeDto} from "../web/dto/RollingWrapUsdVolumeDto";

export class RollingWrapUsdVolumeRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(rollingWrapUsdVolume: RollingWrapUsdVolume, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("rolling_wrap_usd_volume")
      .transacting(transaction)
      .insert(rollingWrapUsdVolume)
      .onConflict(["name", "asset"]).merge();
  }

  async findAll(name: string): Promise<RollingWrapUsdVolumeDto[]> {
    const results = await this._dbClient("rolling_wrap_usd_volume").where({"name": name});
    return results.map(r => ({
      asset: r.asset,
      value: r.value
    }));
  }

  private _dbClient: Knex;
}
