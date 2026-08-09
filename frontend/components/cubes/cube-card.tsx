import Link from "next/link"

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

  return (
    <Link
      href={`/cubes/${cube.id}`}
      className="group flex flex-col overflow-hidden rounded-xl ring-1 ring-foreground/10 transition-colors hover:bg-muted/40 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring/50"
    >
      <div className="relative aspect-[4/3] bg-muted">
        {cube.imageUrl ? (
          // External catalog images; next/image requires remotePatterns — use img for flexibility
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={cube.imageUrl}
            alt={cube.name}
            className="size-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
          />
        ) : (
          <div
            className={cn(
              "flex size-full items-center justify-center text-muted-foreground",
              compact ? "text-xs" : "text-sm"
            )}
          >
            No image
          </div>
        )}
      </div>
      <div className={cn("flex flex-1 flex-col gap-1", compact ? "p-2.5" : "p-3")}>
        <h2
          className={cn(
            "line-clamp-2 font-medium leading-snug group-hover:text-primary",
            compact ? "text-sm" : undefined
          )}
        >
          {cube.name}
        </h2>
        <p className={cn("text-muted-foreground", compact ? "text-xs" : "text-sm")}>
          {cube.brand} · {cube.type}
        </p>
        <p className={cn("mt-auto pt-2", compact ? "text-xs" : "text-sm")}>
          <span className="font-semibold tabular-nums">
            {formatMetric(overall)}
          </span>
          <span className="text-muted-foreground">
            {" "}
            · {cube.reviewCount ?? 0} reviews
          </span>
        </p>
      </div>
    </Link>
  )
}
