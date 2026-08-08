import Link from "next/link"

import { buttonVariants } from "@/components/ui/button"

export default function LandingPage() {
  return (
    <div className="flex min-h-svh flex-col items-center justify-center bg-gradient-to-b from-background via-background to-accent/30 px-6 py-16 text-center">
      <div className="max-w-2xl space-y-6">
        <h1 className="text-5xl font-bold tracking-tight text-primary sm:text-6xl">
          CubeRank
        </h1>
        <p className="text-lg text-muted-foreground sm:text-xl">
          Community reviews, radar metrics, and leaderboards for speedcubes.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3 pt-2">
          <Link
            href="/auth?tab=signup"
            className={buttonVariants({ size: "lg" })}
          >
            Sign up
          </Link>
          <Link
            href="/auth?tab=login"
            className={buttonVariants({ size: "lg", variant: "outline" })}
          >
            Log in
          </Link>
        </div>
      </div>
    </div>
  )
}
