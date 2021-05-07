import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {TvlQuery} from "../../query/TvlQuery";
import {DateTime} from "luxon";
import {GlobalStatsQuery} from "../../query/GlobalStatsQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const tvlQuery = new GlobalStatsQuery(dependencies.dbClient, dependencies.logger);

  router.get('/', async (req: Request, res: Response) => {
    return res.json([]);
  });

  return router;
}

export default buildRouter;
