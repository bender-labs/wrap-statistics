import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {WrapQuery} from "../../query/WrapQuery";
import {DateTime} from "luxon";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const wrapQuery = new WrapQuery(dependencies.dbClient, dependencies.logger);

  router.get('/volume', async (req: Request, res: Response) => {
    const interval = req.query.interval as string;
    const wrapsByInterval = await wrapQuery.wrappingVolume(interval);
    return res.json(wrapsByInterval);
  });

  router.get("/volume/rolling", async (_req: Request, res: Response) => {
    const endTimeOfRollingInterval = DateTime.utc().toMillis();
    const beginTimeOfRollingInterval = DateTime.utc().minus({days: 1}).toMillis();
    return res.json(await wrapQuery.wrappingVolumeFor(beginTimeOfRollingInterval, endTimeOfRollingInterval));
  })

  return router;
}

export default buildRouter;
