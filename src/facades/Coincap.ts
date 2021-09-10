import * as request from "superagent";
import tokenList from "../domain/TokenList";
import {Token} from "../domain/Token";
import {Logger} from "tslog";

export class Coincap {

  async getUsdPriceForToken(token: string, timestamp: number, logger: Logger): Promise<number> {
    let usdPrice = 0;
    const benderToken = this._getBenderToken(token);

    if (benderToken && benderToken.coincapAssetId !== "") {
      usdPrice = await this.getUsdPrice(timestamp, benderToken.coincapAssetId, logger);
      logger.debug("coincap : notional value for token " + benderToken.ethereumSymbol + " at timestamp " + timestamp + " = " + usdPrice);
    }

    return usdPrice;
  }

  async getUsdPrice(timestamp: number, assetId: string, logger: Logger): Promise<number> {
    //It seems that the endpoint queries on a hidden build timestamp. Start and end may not works as you think
    try {
      const twoMinutesEarlier = timestamp - 120000;
      const twoMinutesAfter = timestamp + 120000;

      const response = await request.get("https://api.coincap.io/v2/assets/" + assetId + "/history?interval=h1&start=" + twoMinutesEarlier + "&end=" + twoMinutesAfter);

      if (response && response.status === 200) {
        const prices = response.body;
        if (prices && prices["data"] && prices["data"].length > 0) {
          return +prices["data"][0]["priceUsd"];
        }
      }
    } catch (err) {
      logger.error(err.message);
    }

    return 0;
  }

  private _getBenderToken(token: string): Token {
    return tokenList.find((elt) => elt.type === "ERC20" && elt.token.toLowerCase() === token.toLowerCase());
  }
}
