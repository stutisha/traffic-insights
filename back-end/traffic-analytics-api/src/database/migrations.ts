/**
 * Database schema initialization.
 */

import pool from './connection';

export async function runMigrations(): Promise<void> {
  await pool.query(`
    CREATE TABLE IF NOT EXISTS ingestion_run (
      id BIGSERIAL PRIMARY KEY,
      dataset TEXT NOT NULL,
      started_at TIMESTAMPTZ NOT NULL,
      finished_at TIMESTAMPTZ,
      status TEXT NOT NULL,
      source_updated TEXT,
      rows_seen INTEGER,
      rows_written INTEGER,
      error TEXT
    );

    CREATE TABLE IF NOT EXISTS geo (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS vehicle_type (
      code TEXT PRIMARY KEY,
      label TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS traffic_observation (
      geo_code TEXT NOT NULL REFERENCES geo(code),
      vehicle_code TEXT NOT NULL REFERENCES vehicle_type(code),
      regisveh TEXT NOT NULL,
      unit TEXT NOT NULL,
      year INTEGER NOT NULL,
      value DOUBLE PRECISION,
      flag TEXT,
      source_updated TEXT,
      ingested_at TIMESTAMPTZ NOT NULL,
      updated_at TIMESTAMPTZ NOT NULL,
      PRIMARY KEY (geo_code, vehicle_code, regisveh, unit, year)
    );

    CREATE OR REPLACE VIEW v_country_traffic AS
    SELECT
      observation.geo_code,
      geo.label AS country,
      observation.year,
      observation.value AS mio_vkm,
      observation.flag,
      observation.regisveh
    FROM traffic_observation AS observation
    JOIN geo ON geo.code = observation.geo_code
    WHERE observation.vehicle_code = 'TOTAL'
      AND observation.regisveh = 'TERNAT_REG'
      AND observation.unit = 'MIO_VKM';

    CREATE OR REPLACE VIEW v_vehicle_mix AS
    SELECT
      observation.geo_code,
      geo.label AS country,
      observation.vehicle_code,
      vehicle_type.label AS vehicle_type,
      observation.year,
      observation.value AS mio_vkm,
      observation.flag,
      observation.regisveh
    FROM traffic_observation AS observation
    JOIN geo ON geo.code = observation.geo_code
    JOIN vehicle_type ON vehicle_type.code = observation.vehicle_code
    WHERE observation.vehicle_code <> 'TOTAL'
      AND observation.regisveh = 'TERNAT_REG'
      AND observation.unit = 'MIO_VKM';
  `);
}
