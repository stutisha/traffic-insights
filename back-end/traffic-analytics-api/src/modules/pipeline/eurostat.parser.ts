// Parser for parsing the complex data on eurostat link

import {
  RegistrationScope,
  TrafficObservation,
  TrafficUnit,
  VehicleType,
} from './pipeline.types';


interface JsonStatCategory {
  index: Record<string, number>;
  label?: Record<string, string>;
}

interface JsonStatDimension {
  category: JsonStatCategory;
}

interface JsonStatDataset {
  id: string[];
  size: number[];
  dimension: Record<string, JsonStatDimension>;
  value: Record<string, number | null>;
  status?: Record<string, string> | string[] | string;
  updated?: string;
  extension?: { datasetTimeStamp?: string };
}


function computeStrides(size: number[]): number[] {
  const strides = new Array<number>(size.length);
  strides[size.length - 1] = 1;
  for (let i = size.length - 2; i >= 0; i--) {
    strides[i] = strides[i + 1] * size[i + 1];
  }
  return strides;
}

function decodeFlatIndex(
  flatIndex: number,
  size: number[],
  strides: number[],
): number[] {
  const positions = new Array<number>(size.length);
  for (let i = 0; i < size.length; i++) {
    positions[i] = Math.floor(flatIndex / strides[i]) % size[i];
  }
  return positions;
}


function buildPositionToCode(index: Record<string, number>): string[] {
  const positionToCode: string[] = [];
  for (const [code, position] of Object.entries(index)) {
    positionToCode[position] = code;
  }
  return positionToCode;
}

function readStatus(
  status: JsonStatDataset['status'],
  flatKey: string,
  flatIndex: number,
): string | undefined {
  if (!status) return undefined;
  if (typeof status === 'string') return status || undefined;
  if (Array.isArray(status)) return status[flatIndex] || undefined;
  return status[flatKey] || undefined;
}


export function extractSourceUpdated(raw: unknown): string | null {
  const dataset = raw as JsonStatDataset;
  return dataset?.updated ?? dataset?.extension?.datasetTimeStamp ?? null;
}


export function parseEurostatTrafficData(raw: unknown): TrafficObservation[] {
  const dataset = raw as JsonStatDataset;

  if (
    !dataset ||
    !Array.isArray(dataset.id) ||
    !Array.isArray(dataset.size) ||
    !dataset.dimension ||
    !dataset.value
  ) {
    throw new Error('Unexpected Eurostat response: missing JSON-stat fields');
  }

  const { id: dimensionNames, size, dimension, value, status } = dataset;
  const strides = computeStrides(size);

  
  const dimIndex: Record<string, number> = {};
  dimensionNames.forEach((name, i) => {
    dimIndex[name] = i;
  });
  for (const required of ['regisveh', 'unit', 'vehicle', 'geo', 'time']) {
    if (dimIndex[required] === undefined) {
      throw new Error(`Eurostat response is missing dimension "${required}"`);
    }
  }

  const positionToCode: Record<string, string[]> = {};
  for (const name of dimensionNames) {
    positionToCode[name] = buildPositionToCode(dimension[name].category.index);
  }

  const labelOf = (name: string, code: string): string =>
    dimension[name].category.label?.[code] ?? code;

  const observations: TrafficObservation[] = [];

  for (const flatKey of Object.keys(value)) {
    const trafficValue = value[flatKey];
    if (typeof trafficValue !== 'number' || Number.isNaN(trafficValue)) {
      continue;
    }

    const flatIndex = Number(flatKey);
    const positions = decodeFlatIndex(flatIndex, size, strides);
    const regisScopeCode =
      positionToCode['regisveh'][positions[dimIndex['regisveh']]];
    const unitCode = positionToCode['unit'][positions[dimIndex['unit']]];
    const vehicleCode =
      positionToCode['vehicle'][positions[dimIndex['vehicle']]];
    const geoCode = positionToCode['geo'][positions[dimIndex['geo']]];
    const timeCode = positionToCode['time'][positions[dimIndex['time']]];

    observations.push({
      countryCode: geoCode,
      countryName: labelOf('geo', geoCode),
      year: Number(timeCode),
      vehicleType: vehicleCode as VehicleType,
      vehicleLabel: labelOf('vehicle', vehicleCode),
      registrationScope: regisScopeCode as RegistrationScope,
      unit: unitCode as TrafficUnit,
      trafficValue,
      status: readStatus(status, flatKey, flatIndex),
    });
  }

  return observations;
}
