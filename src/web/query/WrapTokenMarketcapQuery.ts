import {Knex} from "knex";
import {WrapTokenInUsd} from "../../domain/projections/WrapTokenInUsd";
import {ProjectionWrapTokenMarketcapRepository} from "../../repositories/ProjectionWrapTokenMarketcapRepository";
import {ProjectionWrapTokenInUsdRepository} from "../../repositories/ProjectionWrapTokenInUsdRepository";
import BigNumber from "bignumber.js";

export class WrapTokenMarketcapQuery {
  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
    this._projectionWrapTokenMarketcapRepository = new ProjectionWrapTokenMarketcapRepository(dbClient);
    this._projectionWrapTokenInUsdRepository = new ProjectionWrapTokenInUsdRepository(dbClient);
  }

  async fullyDilutedMarketcap(): Promise<string> {
    const lastUsdValue = await this._projectionWrapTokenInUsdRepository.last();
    return new BigNumber(lastUsdValue.value).multipliedBy(100_000_000).toString(10);
  }

  async marketcap(from: number): Promise<Array<WrapTokenInUsd>> {
    return this._projectionWrapTokenMarketcapRepository.findFrom(from);
  }

  private readonly _dbClient: Knex;
  private _projectionWrapTokenInUsdRepository: ProjectionWrapTokenInUsdRepository;
  private _projectionWrapTokenMarketcapRepository: ProjectionWrapTokenMarketcapRepository;
}
