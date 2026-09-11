/**
 * Database interaction
 */

import type { PoolClient } from 'pg';
import pool from '../../database/connection';
import { TrafficObservation } from './pipeline.types';

export interface PersistResult {
  rowsSeen: number;
  rowsWritten: number;
  inserted: number;
  updated: number;
}

export interface IngestionRunSuccess {
  sourceUpdated: string | null;
  rowsSeen: number;
  rowsWritten: number;
}

const ROWS_PER_BATCH = 1000;

export async function startIngestionRun(dataset: string): Promise<number> {
  const { rows } = await pool.query<{ id: number }>(
    `INSERT INTO ingestion_run (dataset, started_at, status)
     VALUES ($1, now(), 'running')
     RETURNING id`,
    [dataset],
  );
  return rows[0].id;
}

export async function finishIngestionRunSuccess(
  id: number,
  { sourceUpdated, rowsSeen, rowsWritten }: IngestionRunSuccess,
): Promise<void> {
  await pool.query(
    `UPDATE ingestion_run
        SET finished_at    = now(),
            status         = 'success',
            source_updated = $2,
            rows_seen      = $3,
            rows_written   = $4
      WHERE id = $1`,
    [id, sourceUpdated, rowsSeen, rowsWritten],
  );
}

export async function finishIngestionRunError(
  id: number,
  errorMessage: string,
): Promise<void> {
  await pool.query(
    `UPDATE ingestion_run
        SET finished_at = now(),
            status      = 'error',
            error       = $2
      WHERE id = $1`,
    [id, errorMessage],
  );
}
async function upsertLookup(
  client: PoolClient,
  table: 'geo' | 'vehicle_type',
  entries: Map<string, string>,
): Promise<void> {
  if (entries.size === 0) return;

  const pairs = [...entries.entries()];
  const valuesClauses: string[] = [];
  const params: unknown[] = [];

  pairs.forEach(([code, label], i) => {
    valuesClauses.push(`($${i * 2 + 1}, $${i * 2 + 2})`);
    params.push(code, label);
  });

  await client.query(
    `INSERT INTO ${table} (code, label)
     VALUES ${valuesClauses.join(', ')}
     ON CONFLICT (code) DO UPDATE SET label = EXCLUDED.label`,
    params,
  );
}

function toObservationParams(o: TrafficObservation, sourceUpdated: string | null): unknown[] {
  return [
    o.countryCode, // geo_code
    o.vehicleType, // vehicle_code
    o.registrationScope, // regisveh
    o.unit, // unit
    o.year, // year
    o.trafficValue, // value
    o.status ?? null, // flag
    sourceUpdated, // source_updated
  ];
}

function buildObservationUpsertSql(rowCount: number): string {
  const paramsPerRow = 8;
  const valuesClauses: string[] = [];

  for (let row = 0; row < rowCount; row++) {
    const base = row * paramsPerRow;
    const p = Array.from({ length: paramsPerRow }, (_, i) => `$${base + i + 1}`);
    valuesClauses.push(`(${p.join(', ')}, now(), now())`);
  }

  return `
    INSERT INTO traffic_observation
      (geo_code, vehicle_code, regisveh, unit, year, value, flag,
       source_updated, ingested_at, updated_at)
    VALUES ${valuesClauses.join(', ')}
    ON CONFLICT (geo_code, vehicle_code, regisveh, unit, year)
    DO UPDATE SET
      value          = EXCLUDED.value,
      flag           = EXCLUDED.flag,
      source_updated = EXCLUDED.source_updated,
      updated_at     = now()
    RETURNING (xmax = 0) AS inserted
  `;
}


export async function saveTrafficObservations(
  observations: TrafficObservation[],
  sourceUpdated: string | null,
): Promise<PersistResult> {
  const result: PersistResult = {
    rowsSeen: observations.length,
    rowsWritten: 0,
    inserted: 0,
    updated: 0,
  };

  if (observations.length === 0) {
    return result;
  }

  const geo = new Map<string, string>();
  const vehicles = new Map<string, string>();
  for (const o of observations) {
    geo.set(o.countryCode, o.countryName);
    vehicles.set(o.vehicleType, o.vehicleLabel);
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    await upsertLookup(client, 'geo', geo);
    await upsertLookup(client, 'vehicle_type', vehicles);

    for (let start = 0; start < observations.length; start += ROWS_PER_BATCH) {
      const batch = observations.slice(start, start + ROWS_PER_BATCH);
      const sql = buildObservationUpsertSql(batch.length);
      const params = batch.flatMap((o) => toObservationParams(o, sourceUpdated));

      const { rows } = await client.query<{ inserted: boolean }>(sql, params);
      for (const row of rows) {
        if (row.inserted) result.inserted++;
        else result.updated++;
      }
    }

    await client.query('COMMIT');
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }

  result.rowsWritten = result.inserted + result.updated;
  return result;
}
