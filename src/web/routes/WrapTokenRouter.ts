import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {WrapTokenPriceInUsdQuery} from "../query/WrapTokenPriceInUsdQuery";
import {DateTime} from "luxon";
import {WrapTokenMarketcapQuery} from "../query/WrapTokenMarketcapQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const pricesQuery = new WrapTokenPriceInUsdQuery(dependencies.dbClient);
  const marketcapQuery = new WrapTokenMarketcapQuery(dependencies.dbClient);

  router.get('/prices', async (req: Request, res: Response) => {
    return res.json({data: await pricesQuery.prices(DateTime.now().minus({months: 1}).toMillis())});
  });

  router.get('/marketcap', async (req: Request, res: Response) => {
    return res.json({data: await marketcapQuery.prices(DateTime.now().minus({months: 1}).toMillis())});
  });

  return router;
}

export default buildRouter;
