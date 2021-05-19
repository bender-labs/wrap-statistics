import {Knex} from "knex";
import {Logger} from "tslog";
import {ProjectionRewardsRepository} from "../../repositories/ProjectionRewardsRepository";
import {ProjectionRewardDto} from "../dto/ProjectionRewardDto";

interface Rewards {
  start: number;
  end: number;
  rewards: ProjectionRewardDto[];
}

export class RewardsQuery {

  constructor(dbClient: Knex, logger: Logger) {
    this._dbClient = dbClient;
    this._logger = logger;
    this._projectionRewardsRepository = new ProjectionRewardsRepository(dbClient);
  }

  async rewardsFor(start: number, end: number): Promise<Rewards> {
    return {
      start: start,
      end: end,
      rewards: await this._projectionRewardsRepository.findAll(start, end)
    };
  }

  private readonly _dbClient: Knex;
  private readonly _logger: Logger;
  private _projectionRewardsRepository: ProjectionRewardsRepository;
}
