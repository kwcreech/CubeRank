"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"

import { useAuth } from "@/components/providers/auth-provider"
import { ReviewList } from "@/components/reviews/review-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Separator } from "@/components/ui/separator"
import { formatMetric } from "@/lib/metrics"
import type { PublicProfile, Review } from "@/lib/types/api"
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

  const reviews: Review[] = profile.reviews.items.map((item) => ({
    id: item.reviewId,
    cubeId: item.cubeId,
    cubeName: item.cubeName,
    cubeType: item.cubeType,
    userId: "",
    username: profile.username,
    avatarUrl: profile.avatarUrl,
    writtenContent: item.writtenContent ?? "",
    youtubeUrl: item.youtubeUrl,
    metrics: item.metrics,
    createdAt: item.createdAt,
    updatedAt: item.createdAt,
  }))

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
        <ReviewList
          reviews={reviews}
          showCube
          emptyMessage="No reviews yet."
        />

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
