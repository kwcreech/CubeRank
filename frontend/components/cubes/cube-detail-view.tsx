"use client"

import Link from "next/link"

import { MetricRadar } from "@/components/charts/metric-radar"
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
        <div className="space-y-6">
          <div className="overflow-hidden rounded-xl bg-muted ring-1 ring-foreground/10">
            {cube.imageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={cube.imageUrl}
                alt={cube.name}
                className="aspect-[4/3] w-full object-cover"
              />
            ) : (
              <div className="flex aspect-[4/3] items-center justify-center text-muted-foreground">
                No image
              </div>
            )}
          </div>

          <div className="space-y-3">
            <div>
              <p className="text-sm text-muted-foreground">
                {cube.brand} · {cube.type}
              </p>
              <h1 className="mt-1 text-3xl font-semibold tracking-tight">
                {cube.name}
              </h1>
            </div>

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
              {cube.productUrl ? (
                <a
                  href={cube.productUrl}
                  target="_blank"
                  rel="noreferrer"
                  className={cn(
                    buttonVariants({ size: "lg", variant: "ghost" })
                  )}
                >
                  Product page
                </a>
              ) : null}
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
