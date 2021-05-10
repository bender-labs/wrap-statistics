import {Request, Response, Router} from 'express';
import {BenderTime} from "../../domain/BenderTime";

function buildRouter(): Router {
  const router = Router();

  router.get('/', async (req: Request, res: Response) => {
    const intervals = new BenderTime().getIntervals("weeks");
    return res.json({weeks: intervals.map(i => ({start: i.start.toMillis(), end: i.end.toMillis()}))});
  });

  return router;
}

export default buildRouter;
