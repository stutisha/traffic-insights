import { render, screen } from '@testing-library/react'
import VehicleDistributionChart from './VehicleDistributionChart'
import { getVehicleMix, getYears } from '@/api/traffic.api'

jest.mock('@/api/traffic.api', () => ({
  getYears: jest.fn(),
  getVehicleMix: jest.fn(),
}))

const mockedGetYears = getYears as jest.Mock
const mockedGetVehicleMix = getVehicleMix as jest.Mock

beforeEach(() => {
  mockedGetYears.mockResolvedValue([2023, 2024])
  mockedGetVehicleMix.mockResolvedValue([])
})

afterEach(() => {
  jest.clearAllMocks()
})

test('shows a friendly empty state when there is no vehicle data', async () => {
  render(<VehicleDistributionChart />)

  expect(
    await screen.findByText(/No vehicle distribution data available for 2024\./i),
  ).toBeInTheDocument()
})
