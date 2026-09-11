// Queries fetching data from the PG DB

import pool from '../../database/connection';

export interface CountryOption {
  geoCode: string;
  country: string;
}

export interface CountryTrafficRow {
  geoCode: string;
  country: string;
  mioVkm: number;
  flag: string | null;
  regisveh: string;
}

export interface VehicleMixRow {
  vehicleCode: string;
  vehicleType: string;
  mioVkm: number;
}

export interface VehicleMixByCountryRow {
  vehicleCode: string;
  vehicleType: string;
  mioVkm: number;
  flag: string | null;
  regisveh: string;
}

export interface CountryTrendRow {
  year: number;
  geoCode: string;
  country: string;
  mioVkm: number;
}

export interface VehicleTrendRow {
  year: number;
  vehicleCode: string;
  vehicleType: string;
  mioVkm: number;
}
/**
 * 
 * Methods interacting with DB layer
 */
export async function getYears(): Promise<number[]> {
  const { rows } = await pool.query<{ year: number }>(
    `SELECT DISTINCT year
       FROM v_country_traffic
      ORDER BY year DESC`,
  );
  return rows.map((r) => r.year);
}

export async function getCountries(): Promise<CountryOption[]> {
  const { rows } = await pool.query<CountryOption>(
    `SELECT DISTINCT geo_code AS "geoCode",
                     country  AS "country"
       FROM v_country_traffic
      ORDER BY "country"`,
  );
  return rows;
}


export async function getCountryTraffic(
  year: number,
): Promise<CountryTrafficRow[]> {
  const { rows } = await pool.query<CountryTrafficRow>(
    `SELECT geo_code       AS "geoCode",
            country        AS "country",
            mio_vkm::float8 AS "mioVkm",
            flag           AS "flag",
            regisveh       AS "regisveh"
       FROM v_country_traffic
      WHERE year = $1
        AND mio_vkm IS NOT NULL
      ORDER BY "mioVkm" DESC`,
    [year],
  );
  return rows;
}


export async function getVehicleMix(year: number): Promise<VehicleMixRow[]> {
  const { rows } = await pool.query<VehicleMixRow>(
    `SELECT vehicle_code            AS "vehicleCode",
            vehicle_type            AS "vehicleType",
            SUM(mio_vkm)::float8    AS "mioVkm"
       FROM v_vehicle_mix
      WHERE year = $1
        AND mio_vkm IS NOT NULL
      GROUP BY vehicle_code, vehicle_type
      ORDER BY "mioVkm" DESC`,
    [year],
  );
  return rows;
}

export async function getVehicleMixByCountry(
  year: number,
  geo: string,
): Promise<VehicleMixByCountryRow[]> {
  const { rows } = await pool.query<VehicleMixByCountryRow>(
    `SELECT vehicle_code    AS "vehicleCode",
            vehicle_type    AS "vehicleType",
            mio_vkm::float8 AS "mioVkm",
            flag            AS "flag",
            regisveh        AS "regisveh"
       FROM v_vehicle_mix
      WHERE year = $1
        AND geo_code = $2
        AND mio_vkm IS NOT NULL
      ORDER BY "mioVkm" DESC`,
    [year, geo],
  );
  return rows;
}

export async function getTopCountries(
  referenceYear: number,
  limit: number,
): Promise<string[]> {
  const { rows } = await pool.query<{ geoCode: string }>(
    `SELECT geo_code AS "geoCode"
       FROM v_country_traffic
      WHERE year = $1
        AND mio_vkm IS NOT NULL
      ORDER BY mio_vkm DESC
      LIMIT $2`,
    [referenceYear, limit],
  );
  return rows.map((r) => r.geoCode);
}


export async function getCountryTrend(
  countryCodes: string[],
): Promise<CountryTrendRow[]> {
  if (countryCodes.length === 0) {
    return [];
  }

  const { rows } = await pool.query<CountryTrendRow>(
    `SELECT year,
            geo_code        AS "geoCode",
            country         AS "country",
            mio_vkm::float8 AS "mioVkm"
       FROM v_country_traffic
      WHERE geo_code = ANY($1::text[])
        AND mio_vkm IS NOT NULL
      ORDER BY year ASC, country`,
    [countryCodes],
  );
  return rows;
}


export async function getVehicleTrend(): Promise<VehicleTrendRow[]> {
  const { rows } = await pool.query<VehicleTrendRow>(
    `SELECT year,
            vehicle_code         AS "vehicleCode",
            vehicle_type         AS "vehicleType",
            SUM(mio_vkm)::float8 AS "mioVkm"
       FROM v_vehicle_mix
      WHERE mio_vkm IS NOT NULL
      GROUP BY year, vehicle_code, vehicle_type
      ORDER BY year ASC, vehicle_code`,
  );
  return rows;
}
