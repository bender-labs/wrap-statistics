import * as express from 'express';
import { Express } from 'express';
import * as cors from 'cors';
import * as compression from "compression";
import * as bodyParser from "body-parser";
import BaseRouter from './routes/Router';
import {IndexerDependencies} from "../indexers/IndexerDependencies";

export function httpServer(dependencies: IndexerDependencies): Express {
  const app = express();
  app.use(express.json());
  app.use(express.urlencoded({ extended: true }));
  app.use(cors());
  app.use(compression());
  app.use(bodyParser.json());
  app.use('/v1', BaseRouter(dependencies));
  return app;
}



