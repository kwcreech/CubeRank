"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatMetric, METRIC_KEYS, METRIC_LABELS } from "@/lib/metrics"
import type { PublicProfile } from "@/lib/types/api"
import { cn } from "@/lib/utils"

function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

export function ProfileView({ profile }: { profile: PublicProfile }) {
  const { user } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const page = profile.reviews.page
  const isOwner =
    user?.username.toLowerCase() === profile.username.toLowerCase()

  const topTypes = Object.entries(profile.topCubesByType).filter(
    ([, cubes]) => cubes.length > 0
  )

  function goToPage(nextPage: number) {
    const params = new URLSearchParams(searchParams.toString())
    if (nextPage <= 0) params.delete("page")
    else params.set("page", String(nextPage))
    const qs = params.toString()
    router.push(
      qs
        ? `/users/${encodeURIComponent(profile.username)}?${qs}`
        : `/users/${encodeURIComponent(profile.username)}`
    )
  }

  return (
    <div className="space-y-10">
      <section className="flex flex-wrap items-start gap-5">
        <Avatar className="size-20 after:rounded-full data-[size=default]:size-20">
          {profile.avatarUrl ? (
            <AvatarImage src={profile.avatarUrl} alt={profile.username} />
          ) : null}
          <AvatarFallback className="text-xl">
            {initials(profile.username)}
          </AvatarFallback>
        </Avatar>

        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold tracking-tight">
              @{profile.username}
            </h1>
            {isOwner ? (
              <Link
                href="/settings"
                className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
              >
                Settings
              </Link>
            ) : null}
          </div>
          <p className="text-muted-foreground">
            Rank #{profile.rank} · {profile.reviewCount} review
            {profile.reviewCount === 1 ? "" : "s"}
          </p>
        </div>
      </section>

      <Separator />

      <section className="space-y-4">
        <h2 className="text-xl font-semibold tracking-tight">
          Recent reviews
        </h2>
        {profile.reviews.items.length === 0 ? (
          <p className="text-sm text-muted-foreground">No reviews yet.</p>
        ) : (
          <ul className="divide-y divide-border">
            {profile.reviews.items.map((review) => (
              <li key={review.reviewId} className="space-y-2 py-5 first:pt-0">
                <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                  <Link
                    href={`/cubes/${review.cubeId}`}
                    className="font-medium hover:text-primary"
                  >
                    {review.cubeName}
                  </Link>
                  <span className="text-xs text-muted-foreground">
                    {review.cubeBrand} · {review.cubeType} ·{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </span>
                </div>
                {review.metrics ? (
                  <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                    {METRIC_KEYS.map((key) => (
                      <span key={key}>
                        {METRIC_LABELS[key]}{" "}
                        <span className="tabular-nums text-foreground">
                          {formatMetric(review.metrics?.[key], 0)}
                        </span>
                      </span>
                    ))}
                  </p>
                ) : null}
                {review.writtenContent ? (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {review.writtenContent}
                  </p>
                ) : null}
                {review.youtubeUrl ? (
                  <a
                    href={review.youtubeUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-block text-sm text-primary hover:underline"
                  >
                    Watch on YouTube
                  </a>
                ) : null}
              </li>
            ))}
          </ul>
        )}

        {profile.reviews.totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3 pt-2">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0}
              onClick={() => goToPage(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page + 1} of {profile.reviews.totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= profile.reviews.totalPages}
              onClick={() => goToPage(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>

      {topTypes.length > 0 ? (
        <>
          <Separator />
          <section className="space-y-6">
            <div>
              <h2 className="text-xl font-semibold tracking-tight">
                Top-rated cubes
              </h2>
              <p className="text-sm text-muted-foreground">
                Highest personal averages by type
              </p>
            </div>
            <div className="space-y-8">
              {topTypes.map(([cubeType, cubes]) => (
                <div key={cubeType} className="space-y-3">
                  <h3 className="text-sm font-medium text-muted-foreground">
                    {cubeType}
                  </h3>
                  <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
                    {cubes.map((cube) => (
                      <li key={cube.cubeId}>
                        <Link
                          href={`/cubes/${cube.cubeId}`}
                          className="block rounded-xl px-4 py-3 ring-1 ring-foreground/10 transition-colors hover:bg-muted/40"
                        >
                          <p className="font-medium">{cube.cubeName}</p>
                          <p className="text-xs text-muted-foreground">
                            {cube.cubeBrand}
                          </p>
                          <p className="mt-2 text-sm">
                            <span className="font-semibold tabular-nums text-primary">
                              {formatMetric(cube.personalAverage)}
                            </span>
                            <span className="text-muted-foreground">
                              {" "}
                              personal avg
                            </span>
                          </p>
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </section>
        </>
      ) : null}
    </div>
  )
}
