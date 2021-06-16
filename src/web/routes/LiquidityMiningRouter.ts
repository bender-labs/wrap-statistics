import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {StakingApyRepository} from "../../repositories/StakingApyRepository";
import {LiquidityMiningApyRepository} from "../../repositories/LiquidityMiningApyRepository";

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const liquidityMiningApyRepository = new LiquidityMiningApyRepository(dependencies.dbClient);

  router.get('/apy', async (req: Request, res: Response) => {
    return res.json(await liquidityMiningApyRepository.findAll());
  });

  return router;
}

export default buildRouter;
