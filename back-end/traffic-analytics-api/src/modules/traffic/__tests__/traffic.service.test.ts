/**
 * traffic.service tests.
 */

import * as repository from '../traffic.repository';
import {
  getCountryTrafficForYear,
  getVehicleMixForYear,
  listYears,
} from '../traffic.service';

jest.mock('../traffic.repository');

const mockedRepository = repository as jest.Mocked<typeof repository>;

afterEach(() => {
  jest.clearAllMocks();
});

describe('traffic.service', () => {
  it('listYears returns the repository result', async () => {
    mockedRepository.getYears.mockResolvedValue([2023, 2022, 2021]);

    const result = await listYears();

    expect(result).toEqual([2023, 2022, 2021]);
    expect(mockedRepository.getYears).toHaveBeenCalledWith();
  });

  it('getCountryTrafficForYear calls the repository with the given year and returns its result', async () => {
    const rows = [
      { geoCode: 'DE', country: 'Germany', mioVkm: 100, flag: null, regisveh: 'TERNAT_REG' },
    ];
    mockedRepository.getCountryTraffic.mockResolvedValue(rows);

    const result = await getCountryTrafficForYear(2023);

    expect(mockedRepository.getCountryTraffic).toHaveBeenCalledWith(2023);
    expect(result).toEqual(rows);
  });

  it('getVehicleMixForYear calls the repository with the given year and returns its result', async () => {
    const rows = [{ vehicleCode: 'CAR', vehicleType: 'Cars', mioVkm: 50 }];
    mockedRepository.getVehicleMix.mockResolvedValue(rows);

    const result = await getVehicleMixForYear(2023);

    expect(mockedRepository.getVehicleMix).toHaveBeenCalledWith(2023);
    expect(result).toEqual(rows);
  });
});
