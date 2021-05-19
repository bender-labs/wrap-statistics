import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {RewardsQuery} from "../query/RewardsQuery";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const rewardsQuery = new RewardsQuery(dependencies.dbClient, dependencies.logger);

  router.get('/users', async (req: Request, res: Response) => {
    if (!req.query.start) {
      return res.status(400).json({message: 'MISSING_START'});
    }
    if (!req.query.end) {
      return res.status(400).json({message: 'MISSING_END'});
    }
    const start = req.query.start as number;
    const end = req.query.end as number;
    return res.json(await rewardsQuery.rewardsFor(start, end));
  });

  return router;
}

export default buildRouter;
