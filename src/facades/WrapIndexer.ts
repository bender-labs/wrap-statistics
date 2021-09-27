import * as request from "superagent";
import tokenList from "../domain/TokenList";
import {Token} from "../domain/Token";
import {Logger} from "tslog";

export interface WrapStakingContract {
  totalRewards: string;
  totalStaked: string;
  startLevel: string;
  startTimestamp: string;
  duration: string;
  farmingContract: string;
  token: Token;
  old: boolean;
}

export interface WrapStackingContract {
  totalStaked: string;
  startLevel: number;
  startTimestamp: string;
  totalRewards: string;
  duration: number;
  farmingContract: string;
  token: Token;
}

export class WrapIndexer {

  async getStakingContractsData(logger: Logger): Promise<Array<WrapStakingContract>> {
    try {
      const response = await request.get("https://indexer.app.tzwrap.com/v1/staking-configuration");

      if (response && response.status === 200) {
        const result: WrapStakingContract[] = [];
        const contracts = response.body.contracts;
        for (const contract of contracts) {
          if (contract.rewards) {
            const token = this._getWrapToken(contract.token, contract.tokenId);
            result.push({
              token,
              totalRewards: contract.rewards.totalRewards,
              totalStaked: contract.totalStaked,
              startLevel: contract.rewards.startLevel,
              startTimestamp: contract.rewards.startTimestamp,
              farmingContract: contract.contract,
              duration: contract.rewards.duration,
              old: contract.old
            });
          }
        }
        return result;
      }
    } catch (err) {
      logger.error(err);
    }
    return [];
  }

  async getStackingContractsData(logger: Logger): Promise<Array<WrapStackingContract>> {
    try {
      const response = await request.get("https://indexer.app.tzwrap.com/v1/stacking-configuration");

      if (response && response.status === 200) {
        const result: WrapStackingContract[] = [];
        const contracts = response.body.contracts;
        for (const contract of contracts) {
          if (contract.totalRewards) {
            result.push({
              token: tokenList.find(t => t.tezosSymbol === "WRAP"),
              totalRewards: contract.totalRewards,
              totalStaked: contract.totalStaked,
              startLevel: contract.startLevel,
              startTimestamp: contract.startTimestamp,
              farmingContract: contract.contract,
              duration: contract.duration
            });
          }
        }
        return result;
      }
    } catch (err) {
      logger.error(err);
    }
    return [];
  }

  private _getWrapToken(tezosContract: string, tezosTokenId: string): Token {
    return tokenList.find((elt) => elt.tezosContract === tezosContract && elt.tezosTokenId.toString() === tezosTokenId);
  }
}
