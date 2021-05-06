import {Knex} from "knex";
import {Mutex} from "async-mutex";
import {Logger} from "tslog";
import {WrapRepository} from "../repositories/WrapRepository";
import {EthereumLock} from "./events/EthereumLock";
import {Wrap} from "./Wrap";

export class WrapUpdater {
  private _canUpdate: Mutex;
  private _logger: Logger;
  private _wrapRepository: WrapRepository;

  constructor(logger: Logger, dbClient: Knex) {
    this._canUpdate = new Mutex();
    this._logger = logger;
    this._wrapRepository = new WrapRepository(dbClient);
  }

  async newEthereumLock(ethereumLock: EthereumLock, transaction: Knex.Transaction): Promise<void> {
    const wrap: Wrap = {
      id: ethereumLock.id,
      amount: ethereumLock.amount,
      ethereumBlock: ethereumLock.ethereumBlock,
      token: ethereumLock.token,
      ethereumFrom: ethereumLock.ethereumFrom,
      ethereumSymbol: ethereumLock.ethereumSymbol,
      type: ethereumLock.type,
      ethereumBlockHash: ethereumLock.ethereumBlockHash,
      ethereumTimestamp: ethereumLock.ethereumTimestamp,
      ethereumTransactionFee: ethereumLock.ethereumTransactionFee,
      ethereumTransactionHash: ethereumLock.ethereumTransactionHash,
      tezosTo: ethereumLock.tezosTo,
      tokenId: ethereumLock.tokenId,
      updatedAt: new Date().getTime()
    };

    const doneUpdate = await this._canUpdate.acquire();

    try {
      const existingWrap = await this._wrapRepository.find(ethereumLock.id);
      this._logger.debug(existingWrap);

      if (existingWrap) {
        //
      } else {
        wrap.status = "ongoing";
        wrap.signatureCount = 0;
        wrap.createdAt = new Date().getTime();
        await this._wrapRepository.save(wrap, transaction);
      }
    } catch (err) {
      this._logger.error(err.message);
    } finally {
      doneUpdate();
    }
  }
}
