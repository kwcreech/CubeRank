import { Suspense } from "react"

import { CubesBrowse } from "@/components/cubes/cubes-browse"
import { PageShell } from "@/components/page-shell"

export default function CubesPage() {
  return (
    <PageShell
      title="Cubes"
      description="Browse and search the LIVE cube catalog."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <CubesBrowse />
      </Suspense>
    </PageShell>
  )
}
