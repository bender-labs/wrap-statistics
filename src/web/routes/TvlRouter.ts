import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {TvlQuery} from "../../query/TvlQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const tvlQuery = new TvlQuery(dependencies.dbClient, dependencies.logger);

  router.get('/volume', async (req: Request, res: Response) => {
    const interval = req.query.interval as string;
    const wrapsByInterval = await tvlQuery.tvlVolume(interval);
    return res.json(wrapsByInterval);
  });

  router.get("/volume/now", async (_req: Request, res: Response) => {
    return res.json(await tvlQuery.tvlVolumeNow());
  })

  return router;
}

export default buildRouter;
