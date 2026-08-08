import { HomeView } from "@/components/home/home-view"
import { PageShell } from "@/components/page-shell"
import {
  getCubeLeaderboard,
  getUserLeaderboard,
  listCubes,
  listRecentReviews,
} from "@/lib/api/client"
import { ApiError } from "@/lib/types/api"
import type {
  CubeLeaderboardEntry,
  CubeSummary,
  Review,
  UserLeaderboardEntry,
} from "@/lib/types/api"

async function loadSafe<T>(
  promise: Promise<T>
): Promise<{ data: T | null; error?: string }> {
  try {
    return { data: await promise }
  } catch (err) {
    const message =
      err instanceof ApiError
        ? err.message
        : "Could not load this section. Is the API running?"
    return { data: null, error: message }
  }
}

export default async function HomePage() {
  const [recentResult, topCubesResult, cubesResult, usersResult] =
    await Promise.all([
      loadSafe(listRecentReviews({ page: 0, size: 10 })),
      loadSafe(
        getCubeLeaderboard({
          type: "3x3",
          sortBy: "overall",
          page: 0,
          size: 5,
        })
      ),
      loadSafe(listCubes({ page: 0, size: 48 })),
      loadSafe(getUserLeaderboard({ page: 0, size: 5 })),
    ])

  const recentReviews: Review[] = recentResult.data?.items ?? []
  const topCubes: CubeLeaderboardEntry[] = topCubesResult.data?.items ?? []
  const risingCubes: CubeSummary[] = [...(cubesResult.data?.items ?? [])]
    .filter((cube) => (cube.reviewCount ?? 0) > 0)
    .sort((a, b) => (b.reviewCount ?? 0) - (a.reviewCount ?? 0))
    .slice(0, 6)
  const topUsers: UserLeaderboardEntry[] = usersResult.data?.items ?? []

  return (
    <PageShell
      title="Home"
      description="Fresh reviews, top-ranked cubes, and the people driving the community."
    >
      <HomeView
        recentReviews={recentReviews}
        topCubes={topCubes}
        risingCubes={risingCubes}
        topUsers={topUsers}
        errors={{
          recent: recentResult.error,
          topCubes: topCubesResult.error,
          rising: cubesResult.error,
          users: usersResult.error,
        }}
      />
    </PageShell>
  )
}
