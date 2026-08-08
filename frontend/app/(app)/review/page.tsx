import { Suspense } from "react"

import { PageShell } from "@/components/page-shell"
import { ReviewForm } from "@/components/reviews/review-form"

export default function ReviewPage() {
  return (
    <PageShell
      title="Write a review"
      description="Select a cube, rate the metrics, and share how it feels."
    >
      <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
        <ReviewForm />
      </Suspense>
    </PageShell>
  )
}
