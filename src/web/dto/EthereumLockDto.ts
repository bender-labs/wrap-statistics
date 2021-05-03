import {EthereumLock} from "../../domain/EthereumLock";

export interface EthereumLockDto extends EthereumLock {
  lockCount: string;
  tokenVolume: string;
  lockUsdTotalValue: string;
  currentUsdTotalValue: string;
  lastIndexedBlock: number;
}
