import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {TvlQuery} from "../../query/TvlQuery";
import {DateTime} from "luxon";
import {GlobalStatsQuery} from "../../query/GlobalStatsQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const globalStatsQuery = new GlobalStatsQuery(dependencies.dbClient, dependencies.logger);

  router.get('/', async (req: Request, res: Response) => {
    if (!req.query.week) {
      return res.status(400).json({ message: 'MISSING_WEEK' });
    }
    const week = req.query.week as string;
    const result = await globalStatsQuery.statsFor(week);
    return res.json(result);
  });

  return router;
}

export default buildRouter;
