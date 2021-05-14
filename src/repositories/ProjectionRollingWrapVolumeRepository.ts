import {Knex} from 'knex';
import {ProjectionRollingWrapVolume} from "../domain/projections/ProjectionRollingWrapVolume";
import {ProjectionRollingWrapVolumeDto} from "../web/dto/ProjectionRollingWrapVolumeDto";

export class ProjectionRollingWrapVolumeRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(rollingWrapUsdVolume: ProjectionRollingWrapVolume, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("projection_rolling_wrap_volume")
      .transacting(transaction)
      .insert(rollingWrapUsdVolume)
      .onConflict(["name", "asset"]).merge();
  }

  async findAll(name: string): Promise<ProjectionRollingWrapVolumeDto[]> {
    const results = await this._dbClient("projection_rolling_wrap_volume").where({"name": name});
    return results.map(r => ({
      asset: r.asset,
      amount: r.amount,
      value: r.usdValue
    }));
  }

  private _dbClient: Knex;
}
