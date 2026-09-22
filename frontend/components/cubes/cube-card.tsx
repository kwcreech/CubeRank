import Link from "next/link"

import { CubeTypeIcon } from "@/components/cubes/cube-type-icon"
import { formatMetric } from "@/lib/metrics"
import type { CubeSummary } from "@/lib/types/api"
import { cn } from "@/lib/utils"

export function CubeCard({
  cube,
  compact = false,
}: {
  cube: CubeSummary
  compact?: boolean
}) {
  const overall = cube.metrics?.overall
  const reviewCount = cube.reviewCount ?? 0

  return (
    <Link
      href={`/cubes/${cube.id}`}
      className={cn(
        "group flex flex-col rounded-xl ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50",
        compact ? "gap-1.5 p-2.5" : "gap-2 p-3"
      )}
    >
      <div className="flex items-center gap-2">
        <CubeTypeIcon type={cube.type} size={compact ? "xs" : "sm"} />
        <p
          className={cn(
            "text-muted-foreground",
            compact ? "text-xs" : "text-sm"
          )}
        >
          {cube.type}
        </p>
      </div>
      <h2
        className={cn(
          "line-clamp-2 font-medium leading-snug group-hover:text-primary",
          compact ? "text-sm" : undefined
        )}
      >
        {cube.name}
      </h2>
      <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
        {cube.brand}
      </p>
      <p className={cn("mt-auto pt-1", compact ? "text-xs" : "text-sm")}>
        <span
          className={cn(
            "font-semibold tabular-nums text-primary",
            compact ? "text-lg" : "text-2xl"
          )}
        >
          {formatMetric(overall)}
        </span>
        <span className="text-muted-foreground">
          {" "}
          · {reviewCount} review{reviewCount === 1 ? "" : "s"}
        </span>
      </p>
    </Link>
  )
}
