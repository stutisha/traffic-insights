/**
 * Traffic API service layer.
 */

import {
  CountryOption,
  CountryTrafficRow,
  CountryTrendRow,
  VehicleMixByCountryRow,
  VehicleMixRow,
  VehicleTrendRow,
  getCountries,
  getCountryTraffic,
  getCountryTrend,
  getTopCountries,
  getVehicleMix,
  getVehicleMixByCountry,
  getVehicleTrend,
  getYears,
} from './traffic.repository';

export interface CountryTrendResult {
  selectedCountries: string[];
  trend: CountryTrendRow[];
}

function assertValidYear(year: number): void {
  if (!Number.isInteger(year)) {
    throw new Error(`Invalid year: ${year}`);
  }
}

export function listYears(): Promise<number[]> {
  return getYears();
}

export function listCountries(): Promise<CountryOption[]> {
  return getCountries();
}


export function getCountryTrafficForYear(
  year: number,
): Promise<CountryTrafficRow[]> {
  assertValidYear(year);
  return getCountryTraffic(year);
}

export function getVehicleMixForYear(year: number): Promise<VehicleMixRow[]> {
  assertValidYear(year);
  return getVehicleMix(year);
}

export function getVehicleMixForCountry(
  year: number,
  geo: string,
): Promise<VehicleMixByCountryRow[]> {
  assertValidYear(year);
  if (!geo) {
    throw new Error('Country code (geo) is required');
  }
  return getVehicleMixByCountry(year, geo);
}

export async function getCountryTrendForYear(
  referenceYear: number,
  limit: number,
): Promise<CountryTrendResult> {
  assertValidYear(referenceYear);

  const selectedCountries = await getTopCountries(referenceYear, limit);
  const trend = await getCountryTrend(selectedCountries);

  return { selectedCountries, trend };
}

export function getVehicleTrendSeries(): Promise<VehicleTrendRow[]> {
  return getVehicleTrend();
}
