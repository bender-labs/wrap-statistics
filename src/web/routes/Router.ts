import {Router} from "express";
import LockRouter from "./LockRouter";
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";

function baseRouter(dependencies: StatisticsDependencies): Router {
  const router = new Router();
  router.use("/locks", LockRouter(dependencies));
  return router;
}

export default baseRouter;
