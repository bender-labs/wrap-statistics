import {ERCType} from "./ErcType";

export interface EthereumLock {
  id: string;
  createdAt?: number;
  updatedAt?: number;
  type: ERCType;
  token: string;
  amount?: number;
  tokenId?: string;
  ethereumSymbol: string;
  ethereumFrom: string;
  ethereumTransactionHash: string;
  ethereumBlockHash: string;
  ethereumBlock: number;
  ethereumTransactionFee: string;
  ethereumTimestamp: number;
  tezosTo: string;
}
