import { Suspense } from "react"

import { LeaderboardsView } from "@/components/leaderboards/leaderboards-view"
import { PageShell } from "@/components/page-shell"

export default function LeaderboardsPage() {
  return (
    <PageShell
      title="Leaderboards"
      description="Top cubes by type and metric, plus top contributors."
    >
      <Suspense
        fallback={<p className="text-sm text-muted-foreground">Loading…</p>}
      >
        <LeaderboardsView />
      </Suspense>
    </PageShell>
  )
}
