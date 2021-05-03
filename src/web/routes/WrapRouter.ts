import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {WrapQuery} from "../../query/WrapQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const wrapQuery = new WrapQuery(dependencies.dbClient, dependencies.logger);

  router.get('/volume', async (req: Request, res: Response) => {
    const interval = req.query.interval as string;
    const wrapsByInterval = await wrapQuery.wrappingVolume(interval);
    return res.json(wrapsByInterval);
  });

  router.get("/volume/rolling", async (_req: Request, res: Response) => {
    return res.json(await wrapQuery.wrappingRollingVolume());
  })

  return router;
}

export default buildRouter;
