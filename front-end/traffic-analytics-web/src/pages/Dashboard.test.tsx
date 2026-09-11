import { render, screen, waitFor } from '@testing-library/react'
import Dashboard from './Dashboard'
import { getCountryTraffic, getCountryTrend, getVehicleMix, getYears } from '@/api/traffic.api'

jest.mock('@/api/traffic.api', () => ({
  getYears: jest.fn(),
  getCountryTraffic: jest.fn(),
  getCountryTrend: jest.fn(),
  getVehicleMix: jest.fn(),
}))

const mockedGetYears = getYears as jest.Mock
const mockedGetCountryTraffic = getCountryTraffic as jest.Mock
const mockedGetCountryTrend = getCountryTrend as jest.Mock
const mockedGetVehicleMix = getVehicleMix as jest.Mock

beforeEach(() => {
  mockedGetYears.mockResolvedValue([2023, 2024])
  mockedGetCountryTraffic.mockResolvedValue([])
  mockedGetCountryTrend.mockResolvedValue({ selectedCountries: [], trend: [] })
  mockedGetVehicleMix.mockResolvedValue([])
})

afterEach(() => {
  jest.clearAllMocks()
})

test('renders the dashboard title', async () => {
  render(<Dashboard />)

  expect(await screen.findByText('European Road Traffic Analytics')).toBeInTheDocument()
})

test('fetches the available years on mount', async () => {
  render(<Dashboard />)

  await waitFor(() => expect(mockedGetYears).toHaveBeenCalled())
})
