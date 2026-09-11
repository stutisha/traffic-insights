import { render, waitFor } from '@testing-library/react'
import CountryTrafficChart from './CountryTrafficChart'
import { getCountryTraffic, getCountryTrend } from '@/api/traffic.api'

jest.mock('@/api/traffic.api', () => ({
  getCountryTraffic: jest.fn(),
  getCountryTrend: jest.fn(),
}))

const mockedGetCountryTraffic = getCountryTraffic as jest.Mock
const mockedGetCountryTrend = getCountryTrend as jest.Mock

beforeEach(() => {
  mockedGetCountryTraffic.mockResolvedValue([])
  mockedGetCountryTrend.mockResolvedValue({ selectedCountries: [], trend: [] })
})

afterEach(() => {
  jest.clearAllMocks()
})

test('fetches country traffic for the selected year', async () => {
  render(<CountryTrafficChart selectedYear={2023} />)

  await waitFor(() => expect(mockedGetCountryTraffic).toHaveBeenCalledWith(2023))
})
