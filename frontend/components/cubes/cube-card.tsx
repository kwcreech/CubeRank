import Link from "next/link"

import { formatMetric } from "@/lib/metrics"
import type { CubeSummary } from "@/lib/types/api"

export function CubeCard({ cube }: { cube: CubeSummary }) {
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
          <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
            No image
          </div>
        )}
      </div>
      <div className="flex flex-1 flex-col gap-1 p-3">
        <h2 className="line-clamp-2 font-medium leading-snug group-hover:text-primary">
          {cube.name}
        </h2>
        <p className="text-sm text-muted-foreground">
          {cube.brand} · {cube.type}
        </p>
        <p className="mt-auto pt-2 text-sm">
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
