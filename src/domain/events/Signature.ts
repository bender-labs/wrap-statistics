export interface WrapSignature {
  wrapId: string;
  signer: string;
  signerAddress: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount?: string;
  tokenId?: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export interface MintingFailedEvent {
  wrapId: string;
  type: 'Erc20MintingFailed' | 'Erc721MintingFailed';
  owner: string;
  level: number;
  reason: string;
  erc: string;
  amount?: string;
  tokenId?: string;
  transactionHash: string;
  blockHash: string;
  logIndex: number;
}

export interface UnwrapSignature {
  wrapId: string;
  signer: string;
  signerAddress: string;
  cid: string;
  type: string;
  signature: string;
  owner: string;
  level: number;
  erc: string;
  amount?: string;
  tokenId?: string;
  operationId: string;
}
