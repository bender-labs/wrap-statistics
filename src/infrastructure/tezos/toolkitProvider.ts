import {TezosToolkit} from '@taquito/taquito';
import {Tzip12Module} from '@taquito/tzip12';
import {Tzip16Module} from '@taquito/tzip16';

export function createTezosToolkit(rpcEndpoint: string): TezosToolkit {
  const tezosToolkit = new TezosToolkit(rpcEndpoint);
  tezosToolkit.addExtension(new Tzip12Module());
  tezosToolkit.addExtension(new Tzip16Module());
  return tezosToolkit;
}
