export type WrapStatus = "ongoing" | "success" | "failure";
export type WrapStep = "locked" | "signed" | "minted";
export type ERCType = "ERC20" | "ERC721";

export interface ERCWrap {
  id: string;
  createdAt: number;
  updatedAt: number;
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
  status: WrapStatus;
  step: WrapStep;
}
