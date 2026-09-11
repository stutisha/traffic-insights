/**
 * Pipeline scheduler.
 */

import cron from 'node-cron';
import { runEurostatSync } from './pipeline.service';

const SCHEDULE = '30 11 * * *';
const TIMEZONE = 'Asia/Dubai';

export function startIngestionScheduler(): void {
  cron.schedule(
    SCHEDULE,
    async () => {
      try {
        await runEurostatSync();
      } catch (err) {
        console.error('[pipeline] scheduled Eurostat sync failed:', err);
      }
    },
    { timezone: TIMEZONE },
  );

  console.log(
    `[pipeline] scheduler registered: "${SCHEDULE}" (${TIMEZONE})`,
  );
}
