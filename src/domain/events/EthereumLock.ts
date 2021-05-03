export type ERCType = "ERC20" | "ERC721";

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
  ethereumTransactionFee: number;
  ethereumTimestamp: number;
  ethereumNotionalValue: number;
  tezosTo: string;
}
