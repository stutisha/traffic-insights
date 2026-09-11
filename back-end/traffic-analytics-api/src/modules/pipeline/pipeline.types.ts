/**
 * Pipeline types.
 */

export type VehicleType =
  | 'TOTAL'
  | 'LOR_RTRN'
  | 'MOTO_MOP'
  | 'CAR'
  | 'BUS_MCO_TRO';

/**
 
 * `TERNAT_REG`    – traffic on national territory by vehicles registered
 *                     domestically OR abroad
 * `TERNAT_REGNAT` – traffic on national territory by nationally registered
 *                     vehicles only
 */
export type RegistrationScope = 'TERNAT_REG' | 'TERNAT_REGNAT';

/**
 * Measurement unit. 
 * million vehicle-kilometres.
 */
export type TrafficUnit = 'MIO_VKM';

/**
 * traffic observation - one measured value for one
 * (country, year, vehicle type, registration scope) combination.
 */
export interface TrafficObservation {

  countryCode: string;

  countryName: string;

  year: number;

  vehicleType: VehicleType;

  vehicleLabel: string;

  registrationScope: RegistrationScope;

  unit: TrafficUnit;

  trafficValue: number;

  status?: string;
}
