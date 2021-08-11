import * as request from "superagent";
import tokenList from "../domain/TokenList";
import {Token} from "../domain/Token";
import {Logger} from "tslog";
import {BenderTime} from "../domain/BenderTime";

export class Coinmetrics {

  async getUsdPriceForToken(timestamp: number, token: string, logger: Logger): Promise<number> {
    const benderToken = this._getBenderToken(token);

    if (benderToken && benderToken.coinmetricsAssetId !== "") {
      return await this.getUsdPrice(timestamp, benderToken.coinmetricsAssetId, logger);
    }

    return 0;
  }

  private _getBenderToken(token: string): Token {
    return tokenList.find((elt) => elt.token.toLowerCase() === token.toLowerCase());
  }

  async getUsdPrice(timestamp: number, assetId: string, logger: Logger): Promise<number> {
    const previousIsoDay = BenderTime.getPreviousIsoDay(timestamp);

    try {
      const response = await request.get("https://community-api.coinmetrics.io/v4/timeseries/asset-metrics?assets=" + assetId + "&metrics=ReferenceRateUSD&frequency=1d&start_time=" + previousIsoDay + "&end_time=" + previousIsoDay);

      if (response && response.status === 200) {
        const prices = response.body;
        if (prices && prices["data"] && prices["data"].length > 0) {
          logger.debug("coinmetrics : notional value for " + assetId + " @ timestamp " + timestamp + " = " + prices["data"][0]["ReferenceRateUSD"]);
          return +prices["data"][0]["ReferenceRateUSD"];
        }
      }
    } catch (err) {
      logger.error(err.message);
    }

    return 0;
  }
}
