export interface TooltipRenderProps {
  active?: boolean
  label?: string | number
  payload?: ReadonlyArray<{
    value?: number | string | ReadonlyArray<number | string>
    name?: string | number
    color?: string
    payload?: Record<string, unknown>
  }>
}

export const tooltipCardClassName =
  'rounded-lg border border-slate-200 bg-white px-3 py-2.5 shadow-lg shadow-slate-900/10'

export function formatPreciseNumber(value: number): string {
  return `${value.toLocaleString('en-US', { maximumFractionDigits: 0 })} million vehicle-km`
}

export function renderShareTooltip({ active, payload }: TooltipRenderProps, total: number) {
  if (!active || !payload || payload.length === 0) return null
  const point = payload[0]
  const name = String(point.name)
  const value = Number(point.value)
  const percentage = total > 0 ? (value / total) * 100 : 0

  return (
    <div className={tooltipCardClassName}>
      <p className="text-xs font-medium text-slate-500">{name}</p>
      <p className="mt-0.5 text-sm font-semibold text-slate-900">
        {formatPreciseNumber(value)}{' '}
        <span className="font-normal text-slate-400">({percentage.toFixed(1)}%)</span>
      </p>
    </div>
  )
}
