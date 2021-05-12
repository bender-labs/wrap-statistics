import {ERCType} from "./events/ErcType";

export interface Token {
  token: string;
  ethereumSymbol: string;
  tezosSymbol: string;
  decimals: number;
  coincapAssetId: string;
  type: ERCType;
  allocation: number;
}
