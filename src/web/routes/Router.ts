import {Router} from "express";
import LockRouter from "./LockRouter";
import {IndexerDependencies} from "../../indexers/IndexerDependencies";

function baseRouter(dependencies: IndexerDependencies): Router {
  const router = new Router();
  router.use("/locks", LockRouter(dependencies));
  return router;
}

export default baseRouter;
