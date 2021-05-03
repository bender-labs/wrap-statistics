import {Request, Response, Router} from "express";
import LockRouter from "./LockRouter";
import {StatisticsDependencies} from "../../indexers/StatisticsDependencies";

function baseRouter(dependencies: StatisticsDependencies): Router {
  const router = new Router();
  router.get("/monitoring", async (_req: Request, res: Response) => {
    return res.json({"message": "ok"});
  });
  router.use("/locks", LockRouter(dependencies));
  return router;
}

export default baseRouter;
