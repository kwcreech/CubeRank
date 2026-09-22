"use client"

import Link from "next/link"

import { MetricRadar } from "@/components/charts/metric-radar"
import { CubeTypeIcon } from "@/components/cubes/cube-type-icon"
import { useAuth } from "@/components/providers/auth-provider"
import { ReviewList } from "@/components/reviews/review-list"
import { buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import {
  formatMetric,
  METRIC_KEYS,
  METRIC_LABELS,
} from "@/lib/metrics"
import type { CubeDetail, Review } from "@/lib/types/api"
import { cn } from "@/lib/utils"

export function CubeDetailView({
  cube,
  reviews,
}: {
  cube: CubeDetail
  reviews: Review[]
}) {
  const { session } = useAuth()
  const reviewHref = session
    ? `/review?cubeId=${cube.id}`
    : `/auth?tab=login&next=${encodeURIComponent(`/review?cubeId=${cube.id}`)}`
  const compareHref = `/compare?leftId=${cube.id}`

  return (
    <div className="space-y-10">
      <section className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] lg:items-start">
        <div className="relative space-y-6 overflow-hidden">
          <CubeTypeIcon
            type={cube.type}
            size="hero"
            tile={false}
            className="pointer-events-none absolute -top-2 right-0 hidden text-primary/10 select-none sm:block"
          />

          <div className="relative space-y-3 sm:pr-28">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <CubeTypeIcon type={cube.type} size="sm" />
              <p>
                {cube.brand} · {cube.type}
              </p>
            </div>
            <h1 className="text-3xl font-semibold tracking-tight">
              {cube.name}
            </h1>

            <p className="text-lg">
              <span className="text-3xl font-semibold tabular-nums text-primary">
                {formatMetric(cube.metrics?.overall)}
              </span>
              <span className="ml-2 text-muted-foreground">
                overall · {cube.reviewCount} review
                {cube.reviewCount === 1 ? "" : "s"}
              </span>
            </p>

            {cube.metrics ? (
              <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
                {METRIC_KEYS.map((key) => (
                  <div key={key}>
                    <dt className="text-muted-foreground">
                      {METRIC_LABELS[key]}
                    </dt>
                    <dd className="font-medium tabular-nums">
                      {formatMetric(cube.metrics?.[key])}
                    </dd>
                  </div>
                ))}
              </dl>
            ) : null}

            <div className="flex flex-wrap gap-3 pt-2">
              <Link
                href={reviewHref}
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Review this cube
              </Link>
              <Link
                href={compareHref}
                className={cn(
                  buttonVariants({ size: "lg", variant: "outline" })
                )}
              >
                Compare this cube
              </Link>
            </div>
          </div>
        </div>

        <MetricRadar metrics={cube.metrics} className="lg:sticky lg:top-20" />
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Recent reviews
        </h2>
        <ReviewList
          reviews={reviews}
          emptyMessage="No reviews yet — be the first to rate this cube."
        />
      </section>
    </div>
  )
}
