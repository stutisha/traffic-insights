import { cn } from "cn"

export type ChartType = "bar" | "line" | "pie"

interface ChartTypeToggleProps {
  value: ChartType
  onChange: (value: ChartType) => void
}

const OPTIONS: { value: ChartType; label: string }[] = [
  { value: "bar", label: "Bar" },
  { value: "line", label: "Line" },
  { value: "pie", label: "Pie" },
]

function ChartTypeToggle({ value, onChange }: ChartTypeToggleProps) {
  return (
    <div
      role="group"
      aria-label="Chart type"
      className="inline-flex items-center gap-0.5 rounded-lg border border-slate-200 bg-slate-50 p-0.5"
    >
      {OPTIONS.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-pressed={value === option.value}
          onClick={() => onChange(option.value)}
          className={cn(
            "rounded-md px-3 py-1 text-xs font-medium transition-colors",
            value === option.value
              ? "bg-[#2C5AA0] text-white shadow-sm"
              : "text-slate-500 hover:bg-white hover:text-slate-900",
          )}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}

export default ChartTypeToggle
