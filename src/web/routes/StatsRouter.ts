import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {GlobalStatsQuery} from "../../query/GlobalStatsQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const globalStatsQuery = new GlobalStatsQuery(dependencies.dbClient, dependencies.logger);

  router.get('/', async (req: Request, res: Response) => {
    if (!req.query.start) {
      return res.status(400).json({message: 'MISSING_START'});
    }
    if (!req.query.end) {
      return res.status(400).json({message: 'MISSING_END'});
    }
    const start = req.query.start as number;
    const end = req.query.end as number;
    return res.json(await globalStatsQuery.statsFor(start, end));
  });

  return router;
}

export default buildRouter;
