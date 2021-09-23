import {Request, Response, Router} from "express";
import lockRouter from "./LockRouter";
import wrapRouter from "./WrapRouter";
import tvlRouter from "./TotalValueLockedRouter";
import statsRouter from "./StatsRouter";
import configurationRouter from "./ConfigurationRouter";
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";
import rewardsRouter from "./RewardsRouter";
import stakingRouter from "./StakingRouter";
import stackingRouter from "./StackingRouter";
import liquidityMiningRouter from "./LiquidityMiningRouter";
import wrapTokenRouter from "./WrapTokenRouter";

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
  router.use("/rewards", rewardsRouter(dependencies));
  router.use("/staking", stakingRouter(dependencies));
  router.use("/stacking", stackingRouter(dependencies));
  router.use("/liquidity-mining", liquidityMiningRouter(dependencies));
  router.use("/wrap-token", wrapTokenRouter(dependencies));
  return router;
}

export default baseRouter;
