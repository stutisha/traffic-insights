import { useEffect, useState } from 'react'
import { getYears } from '@/api/traffic.api'
import DashboardHeader from '@/components/DashboardHeader'
import CountryTrafficChart from '@/components/charts/CountryTrafficChart'
import VehicleDistributionChart from '@/components/charts/VehicleDistributionChart'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'

function Dashboard() {
  const [years, setYears] = useState<number[] | null>(null)
  const [yearsError, setYearsError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  useEffect(() => {
    getYears()
      .then((fetchedYears) => {
        setYears(fetchedYears)
        if (fetchedYears.length > 0) {
          setSelectedYear(Math.max(...fetchedYears))
        }
      })
      .catch((err: unknown) => {
        setYearsError(err instanceof Error ? err.message : 'Failed to load years')
      })
  }, [])

  return (
    <div className="min-h-screen bg-[#F7F9FC]">
      <div className="mx-auto max-w-6xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <DashboardHeader />

          <div className="flex items-center gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 shadow-sm">
            <label
              htmlFor="year-select"
              className="text-xs font-medium tracking-wide text-slate-400 uppercase"
            >
              Year
            </label>

            {yearsError && (
              <Alert variant="destructive" className="max-w-sm border-none p-0">
                <AlertTitle>Couldn&apos;t load years</AlertTitle>
                <AlertDescription>{yearsError}</AlertDescription>
              </Alert>
            )}

            {!yearsError && years === null && <Skeleton className="h-6 w-20" />}

            {!yearsError && years !== null && selectedYear !== null && (
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger
                  id="year-select"
                  size="sm"
                  className="h-6 w-20 border-none bg-transparent p-0 font-semibold text-[#172554] shadow-none focus-visible:ring-0"
                >
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {years.map((year) => (
                    <SelectItem key={year} value={String(year)}>
                      {year}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )}
          </div>
        </div>

        <div className="mt-6">
          {selectedYear !== null && <CountryTrafficChart selectedYear={selectedYear} />}
        </div>

        <div className="mt-6">
          <VehicleDistributionChart />
        </div>
      </div>
    </div>
  )
}

export default Dashboard
