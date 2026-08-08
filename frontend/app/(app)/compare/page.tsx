import { Suspense } from "react"

import { CompareView } from "@/components/cubes/compare-view"
import { PageShell } from "@/components/page-shell"

export default function ComparePage() {
  return (
    <PageShell
      title="Compare cubes"
      description="Pick two cubes of the same type for a side-by-side comparison."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <CompareView />
      </Suspense>
    </PageShell>
  )
}
