import {CronJob} from 'cron';
import {Logger} from 'tslog';
import {StatisticsDependencies} from "../indexers/StatisticsDependencies";

export class Crontab {
  constructor(dependencies: StatisticsDependencies) {
    this._logger = dependencies.logger;
  }

  register(job: () => Promise<void>, pattern: string): void {
    let taskRunning = false;
    this._jobs.push(
      new CronJob({
        cronTime: pattern,
        onTick: async () => {
          if (taskRunning) {
            this._logger.debug('Task already running');
            return;
          }
          try {
            taskRunning = true;
            await job();
          } finally {
            taskRunning = false;
          }
        },
        runOnInit: false,
      })
    );
  }

  start(): void {
    this._jobs.forEach((j) => j.start());
  }

  stop(): void {
    this._jobs.forEach((j) => j.stop());
  }

  private _jobs: CronJob[] = [];
  private _logger: Logger;
}
