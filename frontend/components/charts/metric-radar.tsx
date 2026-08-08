"use client"

import { motion, useReducedMotion } from "motion/react"
import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
} from "recharts"

import { metricsToRadarData } from "@/lib/metrics"
import type { AggregateMetrics, Metrics } from "@/lib/types/api"
import { cn } from "@/lib/utils"

type MetricRadarProps = {
  metrics: Metrics | AggregateMetrics | null | undefined
  className?: string
  color?: string
  label?: string
}

export function MetricRadar({
  metrics,
  className,
  color = "var(--chart-1)",
  label,
}: MetricRadarProps) {
  const reduceMotion = useReducedMotion()
  const data = metricsToRadarData(metrics)
  const hasData = Boolean(metrics)

  return (
    <motion.div
      className={cn("w-full", className)}
      initial={reduceMotion ? false : { opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: "easeOut" }}
    >
      {label ? (
        <p className="mb-2 text-center text-sm font-medium text-muted-foreground">
          {label}
        </p>
      ) : null}
      <div className="aspect-square w-full max-w-sm mx-auto">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart data={data} cx="50%" cy="50%" outerRadius="70%">
            <PolarGrid stroke="var(--border)" />
            <PolarAngleAxis
              dataKey="metric"
              tick={{ fill: "var(--muted-foreground)", fontSize: 12 }}
            />
            <PolarRadiusAxis
              angle={90}
              domain={[0, 10]}
              tickCount={6}
              tick={{ fill: "var(--muted-foreground)", fontSize: 10 }}
            />
            <Radar
              name="Metrics"
              dataKey="value"
              stroke={color}
              fill={color}
              fillOpacity={hasData ? 0.35 : 0.08}
              isAnimationActive={!reduceMotion}
            />
          </RadarChart>
        </ResponsiveContainer>
      </div>
      {!hasData ? (
        <p className="mt-1 text-center text-sm text-muted-foreground">
          No ratings yet
        </p>
      ) : null}
    </motion.div>
  )
}
