import {Logger} from 'tslog';
import {Knex} from 'knex';
import {IpfsClient} from '../../infrastructure/ipfsClient';
import {MintingFailedEvent, UnwrapSignature, WrapSignature} from '../../domain/events/Signature';
import {AppStateRepository} from '../../repositories/AppStateRepository';
import {TezosSigner} from '../../domain/events/TezosSigner';
import {SignatureRepository} from '../../repositories/SignatureRepository';
import {TezosQuorumRepository} from '../../repositories/TezosQuorumRepository';
import {StatisticsDependencies} from "../StatisticsDependencies";

export class SignatureIndexer {

  constructor({logger, ipfsClient, dbClient}: StatisticsDependencies) {
    this._logger = logger;
    this._ipfsClient = ipfsClient;
    this._dbClient = dbClient;
    this._appState = new AppStateRepository(this._dbClient);
    this._SignatureRepository = new SignatureRepository(this._dbClient);
  }

  async index(): Promise<void> {
    this._logger.debug(`Indexing signatures`);
    const signers = await new TezosQuorumRepository(this._dbClient).getActiveSigners();
    for (const signer of signers) {
      this._logger.debug(`Indexing signatures of ${signer.ipnsKey}`);
      let transaction;
      try {
        transaction = await this._dbClient.transaction();
        await this._indexSigner(signer, transaction);
        await transaction.commit();
      } catch (e) {
        this._logger.error(`Can't process signatures ${e.message}`);
        if (transaction) {
          transaction.rollback();
        }
      }
    }
  }

  private async _indexSigner(
    signer: TezosSigner,
    transaction: Knex.Transaction
  ): Promise<void> {
    const cid = await this._resolveIpnsPath('/ipns/' + signer.ipnsKey);
    const lastIndexedSignature = await this._appState.getLastIndexedSignature(
      signer.ipnsKey
    );
    if (cid != null && cid != lastIndexedSignature) {
      let current = cid;
      do {
        const result = await this._resolveDag(current);
        if (result != null) {
          await this._indexSignature(
            signer,
            current.toString(),
            result.value,
            transaction
          );
        }
        current = result && result.value.parent ? '/ipfs/' + result.value.parent : null;
      } while (current && current != lastIndexedSignature);
      await this._appState.setLastIndexedSignature(
        signer.ipnsKey,
        cid.toString(),
        transaction
      );
    }
  }

  private async _indexSignature(
    signer: TezosSigner,
    cid: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any,
    transaction: Knex.Transaction
  ): Promise<void> {
    const signature = this._parseSignature(signer, cid, value);
    this._logger.debug("new signature " + signature.wrapId);
    if (signature) {
      await this._SignatureRepository.save(signature, transaction);
    }
  }

  private async _resolveIpnsPath(path: string): Promise<string | null> {
    try {
      return await this._ipfsClient.resolve(path, {timeout: 20 * 1000});
    } catch (e) {
      this._logger.warn(`Can't resolve ipns path ${path}: ${e.message}`);
      return null;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  private async _resolveDag(path: string): Promise<any | null> {
    try {
      return await this._ipfsClient.dag.get(path);
    } catch (e) {
      this._logger.warn(`Can't resolve dag ${path}: ${e.message}`);
      return null;
    }
  }

  private _parseSignature(
    signer: TezosSigner,
    cid: string,
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    value: any
  ): WrapSignature | UnwrapSignature | MintingFailedEvent {
    switch (value.type) {
      case 'Erc20MintingSigned':
        return {
          wrapId: `${value.payload.parameters.blockHash}:${value.payload.parameters.logIndex}`,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress,
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc20,
          amount: value.payload.parameters.amount,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.parameters.blockHash,
          logIndex: value.payload.parameters.logIndex,
        };
      case 'Erc721MintingSigned':
        return {
          wrapId: `${value.payload.parameters.blockHash}:${value.payload.parameters.logIndex}`,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress,
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc721,
          tokenId: value.payload.parameters.tokenId,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.parameters.blockHash,
          logIndex: value.payload.parameters.logIndex,
        };
      case 'Erc20UnwrapSigned':
        return {
          wrapId: value.payload.parameters.operationId,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress.toLowerCase(),
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc20,
          amount: value.payload.parameters.amount,
          operationId: value.payload.parameters.operationId,
        };
      case 'Erc721UnwrapSigned':
        return {
          wrapId: value.payload.parameters.operationId,
          signer: signer.ipnsKey,
          signerAddress: value.payload.signerAddress.toLowerCase(),
          cid,
          type: value.type,
          signature: value.payload.signature,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          erc: value.payload.parameters.erc721,
          tokenId: value.payload.parameters.tokenId,
          operationId: value.payload.parameters.operationId,
        };
      case 'Erc20MintingFailed':
        return {
          wrapId: `${value.payload.payload.blockHash}:${value.payload.payload.logIndex}`,
          type: value.type,
          owner: value.payload.payload.owner,
          level: value.payload.level,
          reason: value.payload.reason,
          erc: value.payload.payload.erc20,
          amount: value.payload.payload.amount,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.payload.blockHash,
          logIndex: value.payload.payload.logIndex,
        };
      case 'Erc721MintingFailed':
        return {
          wrapId: `${value.payload.parameters.blockHash}:${value.payload.parameters.logIndex}`,
          type: value.type,
          owner: value.payload.parameters.owner,
          level: value.payload.level,
          reason: value.reason,
          erc: value.payload.parameters.erc721,
          tokenId: value.payload.parameters.tokenId,
          transactionHash: value.payload.transactionHash,
          blockHash: value.payload.parameters.blockHash,
          logIndex: value.payload.parameters.logIndex,
        };
      default:
        return null;
    }
  }

  private _logger: Logger;
  private _ipfsClient: IpfsClient;
  private readonly _dbClient: Knex;
  private _appState: AppStateRepository;
  private _SignatureRepository: SignatureRepository;
}
