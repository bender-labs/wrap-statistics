import {Knex} from "knex";
import {WrapTokenTotalSupplyRepository} from "../../repositories/WrapTokenTotalSupplyRepository";
import {WrapTokenTotalSupply} from "../../domain/WrapTokenTotalSupply";

export class WrapTokenTotalSupplyQuery {

  constructor(dbClient: Knex) {
    this._dbClient = dbClient;
    this._wrapTokenTotalSupplyRepository = new WrapTokenTotalSupplyRepository(dbClient);
  }

  async circulatingSupply(): Promise<WrapTokenTotalSupply> {
    return this._wrapTokenTotalSupplyRepository.last();
  }

  private readonly _dbClient: Knex;
  private _wrapTokenTotalSupplyRepository: WrapTokenTotalSupplyRepository;

}
