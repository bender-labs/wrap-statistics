import {Request, Response, Router} from "express";
import lockRouter from "./LockRouter";
import wrapRouter from "./WrapRouter";
import tvlRouter from "./TotalValueLockedRouter";
import statsRouter from "./StatsRouter";
import configurationRouter from "./ConfigurationRouter";
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";

function baseRouter(dependencies: StatisticsDependencies): Router {
  const router = new Router();
  router.get("/monitoring", async (_req: Request, res: Response) => {
    return res.json({"message": "ok"});
  });
  router.use("/configuration", configurationRouter());
  router.use("/locks", lockRouter(dependencies));
  router.use("/wraps", wrapRouter(dependencies));
  router.use("/tvl", tvlRouter(dependencies));
  router.use("/global-stats", statsRouter(dependencies));
  return router;
}

export default baseRouter;
