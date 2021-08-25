import {Knex} from "knex";
import {ProjectionWrapTokenInUsdRepository} from "../../repositories/ProjectionWrapTokenInUsdRepository";
import {WrapTokenInUsd} from "../../domain/projections/WrapTokenInUsd";

export class WrapTokenPriceInUsdQuery {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
    this._projectionWrapTokenInUsdRepository = new ProjectionWrapTokenInUsdRepository(dbClient);
  }

  async prices(from: number): Promise<Array<WrapTokenInUsd>> {
    return this._projectionWrapTokenInUsdRepository.findFrom(from);
  }

  private readonly _dbClient: Knex;
  private _projectionWrapTokenInUsdRepository: ProjectionWrapTokenInUsdRepository;
}
