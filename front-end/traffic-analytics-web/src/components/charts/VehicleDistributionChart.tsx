import { useEffect, useMemo, useState } from 'react'
import { Cell, Legend, Pie, PieChart, ResponsiveContainer, Tooltip } from 'recharts'
import { getVehicleMix, getYears } from '@/api/traffic.api'
import type { VehicleMixRow } from '@/types/traffic.types'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { getVehicleChartColor } from './vehiclePalette'
import { renderShareTooltip, type TooltipRenderProps } from './chartTooltip'

const CHART_HEIGHT = 400

function VehicleDistributionChart() {
  // Owns its year selection independently of the dashboard's global year.
  const [years, setYears] = useState<number[] | null>(null)
  const [yearsError, setYearsError] = useState<string | null>(null)
  const [selectedYear, setSelectedYear] = useState<number | null>(null)

  const [result, setResult] = useState<{ year: number; rows: VehicleMixRow[] } | null>(null)
  const [errorState, setErrorState] = useState<{ year: number; message: string } | null>(null)

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

  useEffect(() => {
    if (selectedYear === null) return

    let cancelled = false

    getVehicleMix(selectedYear)
      .then((rows) => {
        if (!cancelled) setResult({ year: selectedYear, rows })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrorState({
            year: selectedYear,
            message: err instanceof Error ? err.message : 'Failed to load vehicle distribution data',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedYear])

  const rows = result?.year === selectedYear ? result.rows : null
  const fetchError = errorState?.year === selectedYear ? errorState.message : null
  const error = yearsError ?? fetchError

  const pieData = useMemo(() => {
    if (!rows) return null

    const validRows = rows.filter((row) => typeof row.mioVkm === 'number' && Number.isFinite(row.mioVkm))
    const slices = validRows.map((row) => ({ name: row.vehicleType, value: row.mioVkm }))
    const total = slices.reduce((sum, slice) => sum + slice.value, 0)

    return { slices, total }
  }, [rows])

  return (
    <Card className="border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-24px_rgba(15,23,42,0.35)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 shrink-0 rounded-full bg-[#567C8D]" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">
            Vehicle Type Distribution
          </CardTitle>
        </div>
        <CardDescription className="pl-3">
          Traffic performance by vehicle category for the selected year.
        </CardDescription>
        <CardAction>
          <div className="flex items-center gap-2">
            <label
              htmlFor="vehicle-year-select"
              className="text-xs font-medium tracking-wide text-slate-400 uppercase"
            >
              Year
            </label>

            {!yearsError && years === null && <Skeleton className="h-7 w-20" />}

            {!yearsError && years !== null && selectedYear !== null && (
              <Select
                value={String(selectedYear)}
                onValueChange={(value) => setSelectedYear(Number(value))}
              >
                <SelectTrigger
                  id="vehicle-year-select"
                  size="sm"
                  className="h-7 w-20 border-slate-200 bg-white text-sm font-medium text-slate-700"
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
        </CardAction>
      </CardHeader>
      <CardContent>
        {error && (
          <Alert variant="destructive">
            <AlertTitle>Couldn&apos;t load vehicle data</AlertTitle>
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        {!error && pieData === null && <Skeleton style={{ height: CHART_HEIGHT }} className="w-full" />}

        {!error && pieData !== null && pieData.slices.length === 0 && (
          <p className="py-12 text-center text-sm text-muted-foreground">
            No vehicle distribution data available for {selectedYear}.
          </p>
        )}

        {!error && pieData !== null && pieData.slices.length > 0 && (
          <div style={{ height: CHART_HEIGHT }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData.slices}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  outerRadius={130}
                  paddingAngle={1}
                  stroke="#ffffff"
                  strokeWidth={2}
                  isAnimationActive={false}
                >
                  {pieData.slices.map((slice, index) => (
                    <Cell key={slice.name} fill={getVehicleChartColor(index)} />
                  ))}
                </Pie>
                <Tooltip content={(props: TooltipRenderProps) => renderShareTooltip(props, pieData.total)} />
                <Legend
                  iconType="circle"
                  wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)', paddingTop: 8 }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default VehicleDistributionChart
