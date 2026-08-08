"use client"

import Link from "next/link"
import { motion, useReducedMotion } from "motion/react"

import { MetricRadar } from "@/components/charts/metric-radar"
import { HeroBackdrop } from "@/components/landing/hero-backdrop"
import {
  demoCompare,
  demoLeaderboard,
  demoReview,
} from "@/components/landing/demo-data"
import { ScrollReveal } from "@/components/landing/scroll-reveal"
import { buttonVariants } from "@/components/ui/button"
import { formatMetric, METRIC_KEYS, METRIC_LABELS } from "@/lib/metrics"
import { cn } from "@/lib/utils"

function SectionHeading({
  title,
  description,
}: {
  title: string
  description: string
}) {
  return (
    <div className="mx-auto max-w-2xl space-y-3 text-center">
      <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
        {title}
      </h2>
      <p className="text-muted-foreground sm:text-lg">{description}</p>
    </div>
  )
}

export function LandingPage() {
  const reduceMotion = useReducedMotion()

  return (
    <div className="relative overflow-x-hidden bg-background text-foreground">
      <section className="relative flex min-h-svh flex-col items-center justify-center px-6 pb-24 pt-20 text-center">
        <HeroBackdrop />

        <div className="relative z-10 mx-auto flex max-w-3xl flex-col items-center gap-7">
          <motion.h1
            className="font-display text-6xl font-bold tracking-tight text-foreground sm:text-7xl md:text-8xl"
            initial={reduceMotion ? false : { opacity: 0, y: 28 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            CubeRank
          </motion.h1>

          <motion.p
            className="max-w-xl text-lg text-muted-foreground sm:text-xl"
            initial={reduceMotion ? false : { opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.65,
              ease: [0.22, 1, 0.36, 1],
              delay: reduceMotion ? 0 : 0.12,
            }}
          >
            Rate speedcubes with community radars, leaderboards, and
            side-by-side compares.
          </motion.p>

          <motion.div
            className="flex flex-wrap items-center justify-center gap-3"
            initial={reduceMotion ? false : { opacity: 0, y: 14 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.6,
              ease: [0.22, 1, 0.36, 1],
              delay: reduceMotion ? 0 : 0.24,
            }}
          >
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
          </motion.div>
        </div>

        <motion.div
          aria-hidden
          className="absolute bottom-8 left-1/2 z-10 flex -translate-x-1/2 flex-col items-center gap-2 text-muted-foreground"
          initial={reduceMotion ? false : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: reduceMotion ? 0 : 0.8, duration: 0.5 }}
        >
          <span className="text-xs tracking-wide uppercase">Scroll</span>
          <motion.span
            className="block h-8 w-px bg-border"
            animate={reduceMotion ? undefined : { scaleY: [0.55, 1, 0.55] }}
            transition={{ duration: 1.8, repeat: Infinity, ease: "easeInOut" }}
            style={{ transformOrigin: "top" }}
          />
        </motion.div>
      </section>

      <div className="relative mx-auto max-w-5xl space-y-28 px-6 py-20 sm:space-y-36 sm:py-28">
        <ScrollReveal>
          <section className="space-y-10">
            <SectionHeading
              title="Reviews with real metrics"
              description="Five scores on a radar — speed, stability, turning, customizability, and value — plus the write-up that matters."
            />

            <div className="grid items-center gap-10 lg:grid-cols-[1.1fr_0.9fr]">
              <div className="space-y-5 border-y border-border py-6">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">
                    Example review
                  </p>
                  <h3 className="text-2xl font-semibold tracking-tight">
                    {demoReview.cubeName}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {`${demoReview.cubeBrand} · ${demoReview.cubeType} · @${demoReview.username}`}
                  </p>
                </div>

                <dl className="grid grid-cols-2 gap-x-4 gap-y-3 sm:grid-cols-3">
                  <div>
                    <dt className="text-xs text-muted-foreground">Overall</dt>
                    <dd className="text-lg font-semibold tabular-nums">
                      {formatMetric(demoReview.overall)}
                    </dd>
                  </div>
                  {METRIC_KEYS.map((key) => (
                    <div key={key}>
                      <dt className="text-xs text-muted-foreground">
                        {METRIC_LABELS[key]}
                      </dt>
                      <dd className="text-lg font-semibold tabular-nums">
                        {formatMetric(demoReview.metrics[key], 0)}
                      </dd>
                    </div>
                  ))}
                </dl>

                <p className="text-sm leading-relaxed text-muted-foreground sm:text-base">
                  {demoReview.writtenContent}
                </p>
              </div>

              <MetricRadar metrics={demoReview.metrics} />
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="space-y-10">
            <SectionHeading
              title="Leaderboards that move"
              description="See what the community ranks highest — filter by cube type and metric when you join."
            />

            <div className="overflow-x-auto">
              <table className="w-full min-w-[28rem] text-left text-sm">
                <caption className="sr-only">
                  Example 3x3 overall leaderboard
                </caption>
                <thead>
                  <tr className="border-b text-muted-foreground">
                    <th className="py-3 pr-3 font-medium">#</th>
                    <th className="py-3 pr-3 font-medium">Cube</th>
                    <th className="py-3 pr-3 font-medium">Overall</th>
                    <th className="py-3 font-medium">Reviews</th>
                  </tr>
                </thead>
                <tbody>
                  {demoLeaderboard.map((entry, index) => (
                    <motion.tr
                      key={entry.name}
                      className="border-b last:border-0"
                      initial={reduceMotion ? false : { opacity: 0, x: -12 }}
                      whileInView={{ opacity: 1, x: 0 }}
                      viewport={{ once: true, amount: 0.4 }}
                      transition={{
                        duration: 0.4,
                        delay: reduceMotion ? 0 : index * 0.06,
                        ease: "easeOut",
                      }}
                    >
                      <td className="py-3.5 pr-3 tabular-nums text-muted-foreground">
                        {entry.rank}
                      </td>
                      <td className="py-3.5 pr-3">
                        <span className="font-medium">{entry.name}</span>
                        <p className="text-xs text-muted-foreground">
                          {entry.brand}
                        </p>
                      </td>
                      <td className="py-3.5 pr-3 tabular-nums font-medium">
                        {formatMetric(entry.score)}
                      </td>
                      <td className="py-3.5 tabular-nums text-muted-foreground">
                        {entry.reviews}
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
              <p className="mt-3 text-xs text-muted-foreground">
                Illustrative 3x3 overall board — sample data
              </p>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="space-y-10">
            <SectionHeading
              title="Compare before you buy"
              description="Pick two cubes of the same type and read the shape of each radar at a glance."
            />

            <div className="grid gap-10 sm:grid-cols-2">
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {demoCompare.left.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {demoCompare.left.brand} ·{" "}
                    {formatMetric(demoCompare.left.metrics.overall)} overall
                  </p>
                </div>
                <MetricRadar
                  metrics={demoCompare.left.metrics}
                  color="var(--chart-1)"
                />
              </div>
              <div className="space-y-3">
                <div className="text-center">
                  <h3 className="text-lg font-semibold tracking-tight">
                    {demoCompare.right.name}
                  </h3>
                  <p className="text-sm text-muted-foreground">
                    {demoCompare.right.brand} ·{" "}
                    {formatMetric(demoCompare.right.metrics.overall)} overall
                  </p>
                </div>
                <MetricRadar
                  metrics={demoCompare.right.metrics}
                  color="var(--chart-2)"
                />
              </div>
            </div>
          </section>
        </ScrollReveal>

        <ScrollReveal>
          <section className="flex flex-col items-center gap-5 border-t border-border pt-16 text-center">
            <h2 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">
              Ready to rank?
            </h2>
            <p className="max-w-md text-muted-foreground">
              Create an account and start reviewing the cubes you actually
              turn.
            </p>
            <div className="flex flex-wrap items-center justify-center gap-3">
              <Link
                href="/auth?tab=signup"
                className={cn(buttonVariants({ size: "lg" }))}
              >
                Sign up
              </Link>
              <Link
                href="/home"
                className={cn(buttonVariants({ size: "lg", variant: "ghost" }))}
              >
                Browse without an account
              </Link>
            </div>
          </section>
        </ScrollReveal>
      </div>
    </div>
  )
}
