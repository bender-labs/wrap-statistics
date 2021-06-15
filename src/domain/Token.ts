import {ERCType} from "./events/ErcType";

export interface Token {
  token: string;
  tezosContract: string;
  tezosTokenId: number;
  ethereumSymbol: string;
  tezosSymbol: string;
  decimals: number;
  coincapAssetId: string;
  coinmetricsAssetId: string;
  type: ERCType;
  allocation: number;
}
