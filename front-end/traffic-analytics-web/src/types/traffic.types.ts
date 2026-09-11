
/** GET /api/traffic/years */
export type Years = number[];

/** GET /api/traffic/countries */
export interface CountryOption {
  geoCode: string;
  country: string;
}

/** GET /api/traffic/by-country?year= */
export interface CountryTrafficRow {
  geoCode: string;
  country: string;
  mioVkm: number;
  flag: string | null;
  regisveh: string;
}

/** GET /api/traffic/by-vehicle?year= (no geo) */
export interface VehicleMixRow {
  vehicleCode: string;
  vehicleType: string;
  mioVkm: number;
}

/** GET /api/traffic/by-vehicle?year=&geo= */
export interface VehicleMixByCountryRow {
  vehicleCode: string;
  vehicleType: string;
  mioVkm: number;
  flag: string | null;
  regisveh: string;
}

/** A single row of GET /api/traffic/country-trend?year=&limit= */
export interface CountryTrendRow {
  year: number;
  geoCode: string;
  country: string;
  mioVkm: number;
}

/** GET /api/traffic/country-trend?year=&limit= */
export interface CountryTrendResult {
  selectedCountries: string[];
  trend: CountryTrendRow[];
}

/** GET /api/traffic/vehicle-trend */
export interface VehicleTrendRow {
  year: number;
  vehicleCode: string;
  vehicleType: string;
  mioVkm: number;
}
