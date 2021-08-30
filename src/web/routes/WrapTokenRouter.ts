import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {WrapTokenPriceInUsdQuery} from "../query/WrapTokenPriceInUsdQuery";
import {DateTime} from "luxon";
import {WrapTokenMarketcapQuery} from "../query/WrapTokenMarketcapQuery";
import {WrapTokenTotalSupplyQuery} from "../query/WrapTokenTotalSupplyQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const pricesQuery = new WrapTokenPriceInUsdQuery(dependencies.dbClient);
  const supplyQuery = new WrapTokenTotalSupplyQuery(dependencies.dbClient);
  const marketcapQuery = new WrapTokenMarketcapQuery(dependencies.dbClient);

  router.get('/prices', async (req: Request, res: Response) => {
    return res.json({data: await pricesQuery.prices(DateTime.now().minus({months: 1}).toMillis())});
  });

  router.get('/supply', async (req: Request, res: Response) => {
    return res.json({
      circulating: await supplyQuery.circulatingSupply(),
      total: "100000000"
    });
  });

  router.get('/marketcap', async (req: Request, res: Response) => {
    return res.json({
      fullyDiluted: await marketcapQuery.fullyDilutedMarketcap(),
      data: await marketcapQuery.marketcap(DateTime.now().minus({months: 1}).toMillis())
    });
  });

  return router;
}

export default buildRouter;
