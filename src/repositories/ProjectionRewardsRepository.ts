import {Knex} from 'knex';
import {ProjectionReward} from "../domain/projections/ProjectionReward";
import {ProjectionRewardDto} from "../web/dto/ProjectionRewardDto";

export class ProjectionRewardsRepository {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
  }

  async save(projectionReward: ProjectionReward, transaction: Knex.Transaction): Promise<void> {
    await this._dbClient
      .table("projection_rewards")
      .transacting(transaction)
      .insert(projectionReward)
      .onConflict(["start", "end", "asset", "tezos_address"]).merge();
  }

  async findAll(start: number, end: number): Promise<ProjectionRewardDto[]> {
    const results = await this._dbClient("projection_rewards").where({"start": start, "end": end});
    return results.map(r => ({
      asset: r.asset,
      tezos_address: r.tezosAddress,
      amount: r.amount,
      reward: r.reward
    }));
  }

  private _dbClient: Knex;
}
