import { useEffect, useMemo, useState } from 'react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import { getCountryTraffic, getCountryTrend } from '@/api/traffic.api'
import type { CountryTrafficRow, CountryTrendResult } from '@/types/traffic.types'
import {
  Card,
  CardAction,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import ChartTypeToggle, { type ChartType } from '@/components/ChartTypeToggle'
import { BAR_COLOR, getChartColor, OTHER_SLICE_COLOR } from './chartPalette'
import {
  formatPreciseNumber,
  renderShareTooltip,
  tooltipCardClassName,
  type TooltipRenderProps,
} from './chartTooltip'

interface CountryTrafficChartProps {
  selectedYear: number
}

const ROW_HEIGHT = 32
const CHART_MIN_HEIGHT = 320
const LINE_CHART_HEIGHT = 400
const PIE_CHART_HEIGHT = 400
const CHART_MARGIN = { top: 8, right: 24, bottom: 8, left: 8 }
const TREND_LIMIT = 6
const PIE_TOP_N = 8

function formatCompactNumber(value: number): string {
  return new Intl.NumberFormat('en-US', {
    notation: 'compact',
    maximumFractionDigits: 2,
  }).format(value)
}

function renderBarTooltip({ active, payload }: TooltipRenderProps) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]
  const country = (point.payload as { country?: string } | undefined)?.country ?? ''
  const value = Number(point.value)

  return (
    <div className={tooltipCardClassName}>
      <p className="text-xs font-medium text-slate-500">{country}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">{formatPreciseNumber(value)}</p>
    </div>
  )
}

function renderLineTooltip(
  { active, payload, label }: TooltipRenderProps,
  countryNameByGeo: Map<string, string>,
) {
  if (!active || !payload || payload.length === 0) return null

  return (
    <div className={tooltipCardClassName}>
      <p className="text-xs font-medium text-slate-500">Year {label}</p>
      <div className="mt-1.5 space-y-1">
        {payload.map((entry) => {
          const geo = String(entry.name)
          const name = countryNameByGeo.get(geo) ?? geo
          return (
            <div key={geo} className="flex items-center gap-2 text-sm">
              <span className="h-2 w-2 shrink-0 rounded-full" style={{ background: entry.color }} />
              <span className="text-slate-500">{name}</span>
              <span className="ml-auto pl-3 font-semibold text-slate-900">
                {formatPreciseNumber(Number(entry.value))}
              </span>
            </div>
          )
        })}
      </div>
    </div>
  )
}

function CountryTrafficChart({ selectedYear }: CountryTrafficChartProps) {
  const [chartType, setChartType] = useState<ChartType>('bar')

  // Selected-year country traffic (used by Bar and Pie views)
  const [result, setResult] = useState<{ year: number; rows: CountryTrafficRow[] } | null>(null)
  const [errorState, setErrorState] = useState<{ year: number; message: string } | null>(null)

  // Top-N country trend across years (used by Line view), cached per selected year
  const [trendResult, setTrendResult] = useState<{ year: number; data: CountryTrendResult } | null>(null)
  const [trendErrorState, setTrendErrorState] = useState<{ year: number; message: string } | null>(null)

  useEffect(() => {
    let cancelled = false

    getCountryTraffic(selectedYear)
      .then((rows) => {
        if (!cancelled) setResult({ year: selectedYear, rows })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setErrorState({
            year: selectedYear,
            message: err instanceof Error ? err.message : 'Failed to load country traffic data',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [selectedYear])

  useEffect(() => {
    if (chartType !== 'line') return
    if (trendResult?.year === selectedYear) return
    if (trendErrorState?.year === selectedYear) return

    let cancelled = false

    getCountryTrend(selectedYear, TREND_LIMIT)
      .then((data) => {
        if (!cancelled) setTrendResult({ year: selectedYear, data })
      })
      .catch((err: unknown) => {
        if (!cancelled) {
          setTrendErrorState({
            year: selectedYear,
            message: err instanceof Error ? err.message : 'Failed to load country trend data',
          })
        }
      })

    return () => {
      cancelled = true
    }
  }, [chartType, selectedYear, trendResult, trendErrorState])

  const data = result?.year === selectedYear ? result.rows : null
  const error = errorState?.year === selectedYear ? errorState.message : null
  const sortedData = data ? [...data].sort((a, b) => b.mioVkm - a.mioVkm) : null

  const trendData = trendResult?.year === selectedYear ? trendResult.data : null
  const trendError = trendErrorState?.year === selectedYear ? trendErrorState.message : null

  const trendSeries = useMemo(() => {
    if (!trendData) return null

    const countryNameByGeo = new Map(trendData.trend.map((row) => [row.geoCode, row.country]))
    const orderedGeoCodes = trendData.selectedCountries.filter((geo) => countryNameByGeo.has(geo))
    const years = Array.from(new Set(trendData.trend.map((row) => row.year))).sort((a, b) => a - b)

    const chartRows = years.map((year) => {
      const point: Record<string, number | string> = { year }
      for (const geo of orderedGeoCodes) {
        const row = trendData.trend.find((r) => r.year === year && r.geoCode === geo)
        if (row) point[geo] = row.mioVkm
      }
      return point
    })

    return { chartRows, orderedGeoCodes, countryNameByGeo }
  }, [trendData])

  const pieSlices = useMemo(() => {
    if (!sortedData) return null

    const top = sortedData.slice(0, PIE_TOP_N)
    const rest = sortedData.slice(PIE_TOP_N)
    const restTotal = rest.reduce((sum, row) => sum + row.mioVkm, 0)

    const slices = top.map((row) => ({ name: row.country, value: row.mioVkm }))
    if (rest.length > 0) {
      slices.push({ name: 'Other', value: restTotal })
    }

    const total = slices.reduce((sum, slice) => sum + slice.value, 0)
    return { slices, total }
  }, [sortedData])

  const barChartHeight = sortedData
    ? Math.max(CHART_MIN_HEIGHT, sortedData.length * ROW_HEIGHT)
    : CHART_MIN_HEIGHT

  return (
    <Card className="border-slate-200 shadow-[0_1px_2px_rgba(15,23,42,0.04),0_16px_32px_-24px_rgba(15,23,42,0.35)]">
      <CardHeader>
        <div className="flex items-center gap-2">
          <span className="h-5 w-1 shrink-0 rounded-full bg-[#2C5AA0]" aria-hidden="true" />
          <CardTitle className="text-base font-semibold text-slate-900 sm:text-lg">
            Country-wise Traffic
          </CardTitle>
        </div>
        <CardDescription className="pl-3">
          Road traffic performance by country in million vehicle-kilometres.
        </CardDescription>
        <CardAction>
          <ChartTypeToggle value={chartType} onChange={setChartType} />
        </CardAction>
      </CardHeader>
      <CardContent>
        {chartType === 'bar' && (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t load chart data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!error && sortedData === null && (
              <Skeleton style={{ height: CHART_MIN_HEIGHT }} className="w-full" />
            )}

            {!error && sortedData !== null && sortedData.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No traffic data available for {selectedYear}.
              </p>
            )}

            {!error && sortedData !== null && sortedData.length > 0 && (
              <div style={{ height: barChartHeight }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={sortedData} layout="vertical" margin={CHART_MARGIN}>
                    <CartesianGrid horizontal={false} stroke="var(--border)" />
                    <XAxis
                      type="number"
                      tickFormatter={formatCompactNumber}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      type="category"
                      dataKey="country"
                      width={120}
                      interval={0}
                      tick={{ fontSize: 12, fill: 'var(--foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={false}
                    />
                    <Tooltip cursor={{ fill: 'rgba(44, 90, 160, 0.08)' }} content={renderBarTooltip} />
                    <Bar
                      dataKey="mioVkm"
                      fill={BAR_COLOR}
                      radius={[0, 6, 6, 0]}
                      maxBarSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {chartType === 'line' && (
          <>
            {trendError && (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t load trend data</AlertTitle>
                <AlertDescription>{trendError}</AlertDescription>
              </Alert>
            )}

            {!trendError && trendSeries === null && (
              <Skeleton style={{ height: LINE_CHART_HEIGHT }} className="w-full" />
            )}

            {!trendError && trendSeries !== null && trendSeries.orderedGeoCodes.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No trend data available for {selectedYear}.
              </p>
            )}

            {!trendError && trendSeries !== null && trendSeries.orderedGeoCodes.length > 0 && (
              <div style={{ height: LINE_CHART_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={trendSeries.chartRows} margin={CHART_MARGIN}>
                    <CartesianGrid stroke="var(--border)" />
                    <XAxis
                      dataKey="year"
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <YAxis
                      tickFormatter={formatCompactNumber}
                      tick={{ fontSize: 12, fill: 'var(--muted-foreground)' }}
                      axisLine={{ stroke: 'var(--border)' }}
                      tickLine={{ stroke: 'var(--border)' }}
                    />
                    <Tooltip
                      content={(props: TooltipRenderProps) =>
                        renderLineTooltip(props, trendSeries.countryNameByGeo)
                      }
                    />
                    <Legend
                      iconType="circle"
                      formatter={(value) => trendSeries.countryNameByGeo.get(String(value)) ?? String(value)}
                      wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)', paddingTop: 8 }}
                    />
                    {trendSeries.orderedGeoCodes.map((geo, index) => (
                      <Line
                        key={geo}
                        type="monotone"
                        dataKey={geo}
                        name={geo}
                        stroke={getChartColor(index)}
                        strokeWidth={2.5}
                        dot={{ r: 4, strokeWidth: 2, fill: '#fff', stroke: getChartColor(index) }}
                        activeDot={{ r: 6, strokeWidth: 2, fill: '#fff', stroke: getChartColor(index) }}
                        connectNulls={false}
                        isAnimationActive={false}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}

        {chartType === 'pie' && (
          <>
            {error && (
              <Alert variant="destructive">
                <AlertTitle>Couldn&apos;t load chart data</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {!error && pieSlices === null && (
              <Skeleton style={{ height: PIE_CHART_HEIGHT }} className="w-full" />
            )}

            {!error && pieSlices !== null && pieSlices.slices.length === 0 && (
              <p className="py-12 text-center text-sm text-muted-foreground">
                No traffic data available for {selectedYear}.
              </p>
            )}

            {!error && pieSlices !== null && pieSlices.slices.length > 0 && (
              <div style={{ height: PIE_CHART_HEIGHT }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieSlices.slices}
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
                      {pieSlices.slices.map((slice, index) => (
                        <Cell
                          key={slice.name}
                          fill={slice.name === 'Other' ? OTHER_SLICE_COLOR : getChartColor(index)}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={(props: TooltipRenderProps) => renderShareTooltip(props, pieSlices.total)} />
                    <Legend
                      iconType="circle"
                      wrapperStyle={{ fontSize: 12, color: 'var(--muted-foreground)', paddingTop: 8 }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            )}
          </>
        )}
      </CardContent>
    </Card>
  )
}

export default CountryTrafficChart
