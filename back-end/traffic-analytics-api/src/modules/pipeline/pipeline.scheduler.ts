/**
 * Pipeline scheduler.
 */

import cron from 'node-cron';
import type { PoolClient } from 'pg';
import pool from '../../database/connection';
import { runEurostatSync } from './pipeline.service';

const SCHEDULE = '30 11 * * *';
const TIMEZONE = 'Asia/Dubai';
const INGESTION_LOCK_ID = 7219401;

let lockClient: PoolClient | undefined;

export async function startIngestionScheduler(): Promise<boolean> {
  if (lockClient) {
    return true;
  }

  const client = await pool.connect();
  const { rows } = await client.query<{ acquired: boolean }>(
    'SELECT pg_try_advisory_lock($1) AS acquired',
    [INGESTION_LOCK_ID],
  );

  if (!rows[0].acquired) {
    client.release();
    console.log('[pipeline] scheduler is running in another instance');
    return false;
  }

  lockClient = client;

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

  return true;
}
