import type {
  CountryOption,
  CountryTrafficRow,
  CountryTrendResult,
  VehicleMixByCountryRow,
  VehicleMixRow,
  VehicleTrendRow,
  Years,
} from '../types/traffic.types';

const API_BASE = '/api/traffic';

async function fetchJson<T>(path: string, params?: Record<string, string | number>): Promise<T> {
  const url = new URL(path, window.location.origin);

  if (params) {
    const searchParams = new URLSearchParams();
    for (const [key, value] of Object.entries(params)) {
      searchParams.set(key, String(value));
    }
    url.search = searchParams.toString();
  }

  const response = await fetch(url.pathname + url.search);

  if (!response.ok) {
    throw new Error(`Request to ${path} failed with status ${response.status}: ${response.statusText}`);
  }

  return (await response.json()) as T;
}

export function getYears(): Promise<Years> {
  return fetchJson<Years>(`${API_BASE}/years`);
}

export function getCountries(): Promise<CountryOption[]> {
  return fetchJson<CountryOption[]>(`${API_BASE}/countries`);
}

export function getCountryTraffic(year: number): Promise<CountryTrafficRow[]> {
  return fetchJson<CountryTrafficRow[]>(`${API_BASE}/by-country`, { year });
}

export function getVehicleMix(year: number): Promise<VehicleMixRow[]> {
  return fetchJson<VehicleMixRow[]>(`${API_BASE}/by-vehicle`, { year });
}

export function getVehicleMixByCountry(year: number, geo: string): Promise<VehicleMixByCountryRow[]> {
  return fetchJson<VehicleMixByCountryRow[]>(`${API_BASE}/by-vehicle`, { year, geo });
}

export function getCountryTrend(year: number, limit: number): Promise<CountryTrendResult> {
  return fetchJson<CountryTrendResult>(`${API_BASE}/country-trend`, { year, limit });
}

export function getVehicleTrend(): Promise<VehicleTrendRow[]> {
  return fetchJson<VehicleTrendRow[]>(`${API_BASE}/vehicle-trend`);
}
