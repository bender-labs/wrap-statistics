import {Knex} from "knex";
import {WrapTokenInUsd} from "../../domain/projections/WrapTokenInUsd";
import {ProjectionWrapTokenMarketcapRepository} from "../../repositories/ProjectionWrapTokenMarketcapRepository";

export class WrapTokenMarketcapQuery {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
    this._projectionWrapTokenMarketcapRepository = new ProjectionWrapTokenMarketcapRepository(dbClient);
  }

  async prices(from: number): Promise<Array<WrapTokenInUsd>> {
    return this._projectionWrapTokenMarketcapRepository.findFrom(from);
  }

  private readonly _dbClient: Knex;
  private _projectionWrapTokenMarketcapRepository: ProjectionWrapTokenMarketcapRepository;
}
