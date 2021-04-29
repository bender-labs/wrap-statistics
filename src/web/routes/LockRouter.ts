import {Request, Response, Router} from 'express';
import {IndexerDependencies} from "../../indexers/IndexerDependencies";
import {LockQuery} from "../../query/LockQuery";

function buildRouter(dependencies: IndexerDependencies): Router {
  const router = Router();
  const query = new LockQuery(dependencies.dbClient, dependencies.logger);

  router.get('/', async (req: Request, res: Response) => {
    const ethereumFrom = req.query.ethereum_from as string;
    const token = req.query.token as string;
    const ethereumSymbol = req.query.ethereum_symbol as string;
    const tezosTo = req.query.tezos_to as string;

    const locks = await query.search(ethereumFrom, token, ethereumSymbol, tezosTo);
    return res.json(locks);
  });

  return router;
}

export default buildRouter;
