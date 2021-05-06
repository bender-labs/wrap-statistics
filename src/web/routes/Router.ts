import {Request, Response, Router} from "express";
import lockRouter from "./LockRouter";
import wrapRouter from "./WrapRouter";
import tvlRouter from "./TvlRouter";
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";

function baseRouter(dependencies: StatisticsDependencies): Router {
  const router = new Router();
  router.get("/monitoring", async (_req: Request, res: Response) => {
    return res.json({"message": "ok"});
  });
  router.use("/locks", lockRouter(dependencies));
  router.use("/wraps", wrapRouter(dependencies));
  router.use("/tvl", tvlRouter(dependencies));
  return router;
}

export default baseRouter;
