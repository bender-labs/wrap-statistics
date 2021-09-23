import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {StakingApyRepository} from "../../repositories/StakingApyRepository";
import {StackingApyRepository} from "../../repositories/StackingApyRepository";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const stackingApyRepository = new StackingApyRepository(dependencies.dbClient);

  router.get('/apy', async (req: Request, res: Response) => {
    return res.json(await stackingApyRepository.findAll());
  });

  return router;
}

export default buildRouter;
