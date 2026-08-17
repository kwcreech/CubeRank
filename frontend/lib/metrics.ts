import type { AggregateMetrics, Metrics } from "@/lib/types/api"

export const METRIC_KEYS = [
  "controllability",
  "stability",
  "turning",
  "customizability",
  "value",
] as const

export type MetricKey = (typeof METRIC_KEYS)[number]

export const SORT_METRIC_KEYS = ["overall", ...METRIC_KEYS] as const

export type SortMetricKey = (typeof SORT_METRIC_KEYS)[number]

export const METRIC_LABELS: Record<MetricKey, string> = {
  controllability: "Controllability",
  stability: "Stability",
  turning: "Turning",
  customizability: "Customizability",
  value: "Value",
}

export const SORT_METRIC_LABELS: Record<SortMetricKey, string> = {
  overall: "Overall",
  ...METRIC_LABELS,
}

export const METRIC_DESCRIPTORS: Record<
  MetricKey,
  { low: string; high: string }
> = {
  controllability: { low: "Uncontrollable", high: "Very controllable" },
  stability: { low: "Unstable / wobbly", high: "Solid / locked" },
  turning: { low: "Catchy / locky", high: "Smooth / buttery" },
  customizability: { low: "Fixed / limited", high: "Highly tunable" },
  value: { low: "Overpriced", high: "Excellent value" },
}

export function formatMetric(value: number | null | undefined, digits = 1) {
  if (value === null || value === undefined || Number.isNaN(value)) {
    return "—"
  }
  return Number(value).toFixed(digits)
}

export function metricsToRadarData(
  metrics: Metrics | AggregateMetrics | null | undefined
) {
  return METRIC_KEYS.map((key) => ({
    metric: METRIC_LABELS[key],
    value: metrics ? Number(metrics[key]) : 0,
    fullMark: 10,
  }))
}
