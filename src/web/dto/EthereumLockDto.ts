import {EthereumLock} from "../../domain/events/EthereumLock";

export interface EthereumLockDto extends EthereumLock {
  lockCount: string;
  tokenVolume: string;
  lockUsdTotalValue: string;
  currentUsdTotalValue: string;
  lastIndexedBlock: number;
}
