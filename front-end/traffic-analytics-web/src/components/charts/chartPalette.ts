const CHART_PALETTE = ["#2C5AA0", "#0D9488", "#7C3AED", "#0284C7", "#059669", "#D97706"] as const

export function getChartColor(index: number): string {
  return CHART_PALETTE[index % CHART_PALETTE.length]
}

export const BAR_COLOR = "#2C5AA0"
export const BAR_HOVER_COLOR = "#244A85"
export const OTHER_SLICE_COLOR = "#94A3B8"
