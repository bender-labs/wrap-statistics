import {Request, Response, Router} from 'express';
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import {LockQuery} from "../query/LockQuery";

interface Total {
  lastIndexedBlock: number;
  lockCount: number;
  lockUsdTotalValue: number;
  currentUsdTotalValue: number;
}

function buildRouter(dependencies: StatisticsDependencies): Router {
  const router = Router();
  const query = new LockQuery(dependencies.dbClient, dependencies.ethereumConfiguration, dependencies.logger);

  router.get('/', async (req: Request, res: Response) => {
    const ethereumFrom = req.query.ethereum_from as string;
    const token = req.query.token as string;
    const ethereumSymbol = req.query.ethereum_symbol as string;
    const tezosTo = req.query.tezos_to as string;

    const locks = await query.search(ethereumFrom, token, ethereumSymbol, tezosTo);

    return res.json(locks);
  });

  router.get('/total', async (_req: Request, res: Response) => {
    const allLocksByToken = await query.search(null, null, null, null);

    const total: Total = {
      lastIndexedBlock: 0,
      lockCount: 0,
      lockUsdTotalValue: 0,
      currentUsdTotalValue: 0
    };

    if (allLocksByToken.length > 0) {
      total.lastIndexedBlock = allLocksByToken[0].lastIndexedBlock;

      allLocksByToken.forEach((locksByToken) => {
        total.lockCount += parseInt(locksByToken.lockCount);
        total.lockUsdTotalValue += parseInt(locksByToken.lockUsdTotalValue);
        total.currentUsdTotalValue += +locksByToken.currentUsdTotalValue;
      });
    }

    return res.json(total);
  });

  return router;
}

export default buildRouter;
