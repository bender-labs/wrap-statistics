import {EthereumUnlock} from "../../domain/events/EthereumUnlock";

export interface EthereumUnlockDto extends EthereumUnlock {
  unlockCount: string;
  tokenVolume: string;
  unlockUsdTotalValue: string;
  currentUsdTotalValue: string;
  lastIndexedBlock: number;
}
