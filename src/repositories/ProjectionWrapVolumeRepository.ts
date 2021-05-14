import {Knex} from 'knex';
import {ProjectionWrapVolume} from "../domain/projections/ProjectionWrapVolume";
import {ProjectionWrapVolumeDto} from "../web/dto/ProjectionWrapVolumeDto";

export class ProjectionWrapVolumeRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(wrapUsdVolume: ProjectionWrapVolume, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("projection_wrap_volume")
      .transacting(transaction)
      .insert(wrapUsdVolume)
      .onConflict(["start", "end", "asset"]).merge();
  }

  async find(start: number, end: number): Promise<ProjectionWrapVolumeDto[]> {
    const results = await this._dbClient("projection_wrap_volume").where({"start": start, "end": end});
    return results.map(r => ({
      asset: r.asset,
      amount: r.amount,
      value: r.usdValue
    }));
  }

  private _dbClient: Knex;
}
