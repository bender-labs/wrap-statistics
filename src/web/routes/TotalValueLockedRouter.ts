import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {TotalValueLockedQuery} from "../query/TotalValueLockedQuery";
import {DateTime} from "luxon";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const tvlQuery = new TotalValueLockedQuery(dependencies.dbClient, dependencies.logger);

  router.get('/volume', async (req: Request, res: Response) => {
    const interval = req.query.interval as string;
    const wrapsByInterval = await tvlQuery.tvlVolume(interval);
    return res.json(wrapsByInterval);
  });

  router.get("/volume/now", async (_req: Request, res: Response) => {
    const endTimeOfRollingInterval = DateTime.utc().toMillis();
    return res.json(await tvlQuery.tvlUsdVolumeFor(endTimeOfRollingInterval));
  });

  return router;
}

export default buildRouter;
