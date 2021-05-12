import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {WrapVolumeQuery} from "../query/WrapVolumeQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const wrapQuery = new WrapVolumeQuery(dependencies.dbClient, dependencies.logger);

  router.get('/volume', async (req: Request, res: Response) => {
    const interval = req.query.interval as string;
    const wrapsByInterval = await wrapQuery.wrappingVolume(interval);
    return res.json(wrapsByInterval);
  });

  router.get("/volume/rolling", async (_req: Request, res: Response) => {
    return res.json(await wrapQuery.rollingWrappingVolume("24h"));
  });

  return router;
}

export default buildRouter;
