import * as request from "superagent";
import tokenList from "../domain/TokenList";
import {Token} from "../domain/Token";
import {Logger} from "tslog";

export class Coincap {

  async getUsdPrice(token: string, timestamp: number, logger: Logger): Promise<number> {
    let usdPrice = 0;
    const benderToken = this._getBenderToken(token);

    if (benderToken && benderToken.coincapAssetId !== "") {
      try {
        const twoMinutesEarlier = timestamp - 120000;

        const response = await request.get("https://api.coincap.io/v2/assets/" + benderToken.coincapAssetId + "/history?interval=m1&start=" + twoMinutesEarlier + "&end=" + timestamp);
        if (response && response.status === 200) {
          const prices = response.body;
          if (prices && prices["data"] && prices["data"].length > 0) {
            usdPrice = +prices["data"][0]["priceUsd"];
            logger.debug("notional value for token " + benderToken.ethereumSymbol + " at timestamp " + timestamp + " = " + usdPrice);
          }
        }
      } catch (err) {
        logger.error(err);
      }
    }

    return usdPrice;
  }

  private _getBenderToken(token: string): Token {
    return tokenList.find((elt) => elt.token.toLowerCase() === token.toLowerCase());
  }
}
