import {ERCType} from "./ErcType";

export interface EthereumUnlock {
  id: string;
  createdAt?: number;
  updatedAt?: number;
  type: ERCType;
  token: string;
  amount?: number;
  tokenId?: string;
  ethereumSymbol: string;
  ethereumTo: string;
  ethereumTransactionHash: string;
  ethereumBlockHash: string;
  ethereumBlock: number;
  ethereumTransactionFee: string;
  ethereumTimestamp: number;
  tezosOperationHash: string;
  tezosFrom?: string;
  success: boolean;
}
