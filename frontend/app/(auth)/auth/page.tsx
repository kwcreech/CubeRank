import { Suspense } from "react"

import { AuthView } from "@/components/auth/auth-view"

export default function AuthPage() {
  return (
    <Suspense
      fallback={
        <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-4">
          <p className="text-sm text-muted-foreground">Loading…</p>
        </div>
      }
    >
      <AuthView />
    </Suspense>
  )
}
