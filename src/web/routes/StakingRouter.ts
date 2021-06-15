import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {StakingApyRepository} from "../../repositories/StakingApyRepository";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const stakingApyRepository = new StakingApyRepository(dependencies.dbClient);

  router.get('/apy', async (req: Request, res: Response) => {
    return res.json(await stakingApyRepository.findAll());
  });

  return router;
}

export default buildRouter;
