import {ethers} from 'ethers';

export function createEthereumProvider(
  rpcEndpoint: string
): ethers.providers.Provider {
  return new ethers.providers.JsonRpcProvider(rpcEndpoint);
}
