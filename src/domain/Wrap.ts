import {EthereumLock} from "./events/EthereumLock";

export type WrapStatus = "ongoing" | "done" | "fail";

export interface Wrap extends EthereumLock {
  signatureCount?: number;
  status?: WrapStatus;
}
