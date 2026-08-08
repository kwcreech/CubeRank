import Link from "next/link"
import type { ReactNode } from "react"

import { CubeCard } from "@/components/cubes/cube-card"
import { ReviewList } from "@/components/reviews/review-list"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import { formatMetric } from "@/lib/metrics"
import type {
  CubeLeaderboardEntry,
  CubeSummary,
  Review,
  UserLeaderboardEntry,
} from "@/lib/types/api"
import { cn } from "@/lib/utils"

function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

function Section({
  title,
  description,
  action,
  children,
}: {
  title: string
  description?: string
  action?: ReactNode
  children: ReactNode
}) {
  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight">{title}</h2>
          {description ? (
            <p className="text-sm text-muted-foreground">{description}</p>
          ) : null}
        </div>
        {action}
      </div>
      {children}
    </section>
  )
}

export function HomeView({
  recentReviews,
  topCubes,
  risingCubes,
  topUsers,
  errors,
}: {
  recentReviews: Review[]
  topCubes: CubeLeaderboardEntry[]
  risingCubes: CubeSummary[]
  topUsers: UserLeaderboardEntry[]
  errors: {
    recent?: string
    topCubes?: string
    rising?: string
    users?: string
  }
}) {
  return (
    <div className="space-y-14">
      <div className="flex flex-wrap gap-2">
        <Link href="/review" className={buttonVariants({ size: "sm" })}>
          Write a review
        </Link>
        <Link
          href="/compare"
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Compare cubes
        </Link>
        <Link
          href="/cubes"
          className={buttonVariants({ size: "sm", variant: "outline" })}
        >
          Browse cubes
        </Link>
      </div>

      <Section
        title="Recent reviews"
        description="Latest community write-ups across the catalog."
      >
        {errors.recent ? (
          <p className="text-sm text-destructive">{errors.recent}</p>
        ) : (
          <ReviewList
            reviews={recentReviews}
            showCube
            emptyMessage="No reviews yet. Be the first to write one."
          />
        )}
      </Section>

      <Section
        title="Top 3x3"
        description="Highest Bayesian overall scores among LIVE 3x3s."
        action={
          <Link
            href="/leaderboards?type=3x3&sortBy=overall"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-primary"
            )}
          >
            Full leaderboard
          </Link>
        }
      >
        {errors.topCubes ? (
          <p className="text-sm text-destructive">{errors.topCubes}</p>
        ) : topCubes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No ranked 3x3 cubes yet.
          </p>
        ) : (
          <ol className="divide-y divide-border">
            {topCubes.map((entry) => (
              <li key={entry.cubeId} className="flex items-center gap-4 py-3">
                <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">
                  {entry.rank}
                </span>
                <div className="size-12 shrink-0 overflow-hidden rounded-lg bg-muted">
                  {entry.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={entry.imageUrl}
                      alt=""
                      className="size-full object-cover"
                    />
                  ) : null}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/cubes/${entry.cubeId}`}
                    className="font-medium hover:text-primary"
                  >
                    {entry.name}
                  </Link>
                  <p className="text-sm text-muted-foreground">
                    {entry.brand} · {entry.reviewCount} reviews
                  </p>
                </div>
                <span className="text-sm font-semibold tabular-nums">
                  {formatMetric(entry.bayesianScore)}
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>

      <Section
        title="Most reviewed"
        description="LIVE cubes with the most community reviews."
        action={
          <Link
            href="/cubes"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-primary"
            )}
          >
            Browse all
          </Link>
        }
      >
        {errors.rising ? (
          <p className="text-sm text-destructive">{errors.rising}</p>
        ) : risingCubes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No reviewed cubes yet.
          </p>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {risingCubes.map((cube) => (
              <CubeCard key={cube.id} cube={cube} />
            ))}
          </div>
        )}
      </Section>

      <Section
        title="Top contributors"
        description="Members ranked by review count."
        action={
          <Link
            href="/leaderboards"
            className={cn(
              buttonVariants({ variant: "ghost", size: "sm" }),
              "text-primary"
            )}
          >
            See rankings
          </Link>
        }
      >
        {errors.users ? (
          <p className="text-sm text-destructive">{errors.users}</p>
        ) : topUsers.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributors yet.</p>
        ) : (
          <ol className="divide-y divide-border">
            {topUsers.map((entry) => (
              <li key={entry.userId} className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm font-semibold tabular-nums text-muted-foreground">
                  {entry.rank}
                </span>
                <Avatar size="sm">
                  {entry.avatarUrl ? (
                    <AvatarImage src={entry.avatarUrl} alt={entry.username} />
                  ) : null}
                  <AvatarFallback>{initials(entry.username)}</AvatarFallback>
                </Avatar>
                <Link
                  href={`/users/${encodeURIComponent(entry.username)}`}
                  className="min-w-0 flex-1 font-medium hover:text-primary"
                >
                  @{entry.username}
                </Link>
                <span className="text-sm text-muted-foreground tabular-nums">
                  {entry.reviewCount} reviews
                </span>
              </li>
            ))}
          </ol>
        )}
      </Section>
    </div>
  )
}
