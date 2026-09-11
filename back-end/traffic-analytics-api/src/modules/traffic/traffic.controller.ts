/**
 * Traffic API HTTP layer.
 */

import type { NextFunction, Request, Response } from 'express';
import {
  getCountryTrafficForYear,
  getCountryTrendForYear,
  getVehicleMixForCountry,
  getVehicleMixForYear,
  getVehicleTrendSeries,
  listCountries,
  listYears,
} from './traffic.service';

function parsePositiveInt(value: unknown): number | undefined {
  if (typeof value !== 'string' || !/^\d+$/.test(value.trim())) {
    return undefined;
  }
  const n = Number(value.trim());
  return Number.isInteger(n) && n > 0 ? n : undefined;
}

export async function getYears(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await listYears());
  } catch (err) {
    next(err);
  }
}

export async function getCountries(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await listCountries());
  } catch (err) {
    next(err);
  }
}

export async function getCountryTraffic(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const year = parsePositiveInt(req.query.year);
    if (year === undefined) {
      res.status(400).json({
        error: 'Query parameter "year" is required and must be a positive integer',
      });
      return;
    }

    res.json(await getCountryTrafficForYear(year));
  } catch (err) {
    next(err);
  }
}


export async function getVehicleMix(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const year = parsePositiveInt(req.query.year);
    if (year === undefined) {
      res.status(400).json({
        error: 'Query parameter "year" is required and must be a positive integer',
      });
      return;
    }

    const rawGeo = req.query.geo;
    const geo =
      typeof rawGeo === 'string' && rawGeo.trim() !== ''
        ? rawGeo.trim().toUpperCase()
        : undefined;

    const data = geo
      ? await getVehicleMixForCountry(year, geo)
      : await getVehicleMixForYear(year);

    res.json(data);
  } catch (err) {
    next(err);
  }
}

export async function getCountryTrend(
  req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    const year = parsePositiveInt(req.query.year);
    const limit = parsePositiveInt(req.query.limit);

    if (year === undefined || limit === undefined) {
      res.status(400).json({
        error:
          'Query parameters "year" and "limit" are required and must be positive integers',
      });
      return;
    }

    res.json(await getCountryTrendForYear(year, limit));
  } catch (err) {
    next(err);
  }
}

export async function getVehicleTrend(
  _req: Request,
  res: Response,
  next: NextFunction,
): Promise<void> {
  try {
    res.json(await getVehicleTrendSeries());
  } catch (err) {
    next(err);
  }
}
