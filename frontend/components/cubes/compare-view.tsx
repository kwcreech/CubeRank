"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { MetricRadar } from "@/components/charts/metric-radar"
import { CubeCombobox } from "@/components/cubes/cube-combobox"
import { Button, buttonVariants } from "@/components/ui/button"
import { Card, CardContent, CardHeader } from "@/components/ui/card"
import { Label } from "@/components/ui/label"
import {
  OptionCombobox,
  toComboboxOptions,
} from "@/components/ui/option-combobox"
import { Separator } from "@/components/ui/separator"
import {
  compareCubes,
  getCube,
  getCubeMeta,
  listAllCubes,
} from "@/lib/api/client"
import {
  formatMetric,
  METRIC_KEYS,
  METRIC_LABELS,
} from "@/lib/metrics"
import {
  ApiError,
  type CubeCompare,
  type CubeSummary,
} from "@/lib/types/api"
import { cn } from "@/lib/utils"

export function CompareView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const leftPrefill = searchParams.get("leftId")
  const rightPrefill = searchParams.get("rightId")

  const [types, setTypes] = useState<string[]>([])
  const [cubes, setCubes] = useState<CubeSummary[]>([])
  const [type, setType] = useState<string | null>(null)
  const [leftId, setLeftId] = useState<string | null>(leftPrefill)
  const [rightId, setRightId] = useState<string | null>(rightPrefill)
  const [result, setResult] = useState<CubeCompare | null>(null)
  const [loadingCubes, setLoadingCubes] = useState(false)
  const [loadingCompare, setLoadingCompare] = useState(false)
  const [bootstrapping, setBootstrapping] = useState(Boolean(leftPrefill))

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const meta = await getCubeMeta()
        if (!cancelled) setTypes(meta.types)
      } catch {
        if (!cancelled) setTypes([])
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function bootstrap() {
      if (!leftPrefill) {
        setBootstrapping(false)
        return
      }

      try {
        const left = await getCube(leftPrefill)
        if (cancelled) return
        setType(left.type)
        setLeftId(String(left.id))

        if (rightPrefill) {
          const right = await getCube(rightPrefill)
          if (cancelled) return
          if (right.type !== left.type) {
            toast.error("Both cubes must be the same type.")
            setRightId(null)
          } else {
            setRightId(String(right.id))
          }
        }
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof ApiError
              ? err.message
              : "Could not load preselected cube."
          )
        }
      } finally {
        if (!cancelled) setBootstrapping(false)
      }
    }

    void bootstrap()
    return () => {
      cancelled = true
    }
  }, [leftPrefill, rightPrefill])

  useEffect(() => {
    if (!type) return

    let cancelled = false

    async function loadTypeCubes() {
      setLoadingCubes(true)
      try {
        const items = await listAllCubes({ type: type ?? undefined })
        if (cancelled) return
        setCubes(items)
      } catch (err) {
        if (!cancelled) {
          setCubes([])
          toast.error(
            err instanceof ApiError ? err.message : "Failed to load cubes."
          )
        }
      } finally {
        if (!cancelled) setLoadingCubes(false)
      }
    }

    void loadTypeCubes()
    return () => {
      cancelled = true
    }
  }, [type])

  const canCompare = Boolean(leftId && rightId && leftId !== rightId)

  useEffect(() => {
    if (!canCompare || !leftId || !rightId) return

    const activeLeftId = leftId
    const activeRightId = rightId
    let cancelled = false

    async function runCompare() {
      setLoadingCompare(true)
      try {
        const data = await compareCubes(activeLeftId, activeRightId)
        if (!cancelled) setResult(data)
      } catch (err) {
        if (!cancelled) {
          setResult(null)
          toast.error(
            err instanceof ApiError ? err.message : "Comparison failed."
          )
        }
      } finally {
        if (!cancelled) setLoadingCompare(false)
      }
    }

    void runCompare()
    return () => {
      cancelled = true
    }
  }, [canCompare, leftId, rightId])

  function syncUrl(nextLeft: string | null, nextRight: string | null) {
    const params = new URLSearchParams()
    if (nextLeft) params.set("leftId", nextLeft)
    if (nextRight) params.set("rightId", nextRight)
    const qs = params.toString()
    router.replace(qs ? `/compare?${qs}` : "/compare")
  }

  const typeCubes = type ? cubes : []
  const leftOptions = typeCubes.filter((cube) => String(cube.id) !== rightId)
  const rightOptions = typeCubes.filter((cube) => String(cube.id) !== leftId)
  const displayResult = canCompare ? result : null

  return (
    <div className="space-y-10">
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="space-y-2">
          <Label>Type</Label>
          <OptionCombobox
            value={type}
            disabled={bootstrapping}
            onValueChange={(value) => {
              setType(value)
              setLeftId(null)
              setRightId(null)
              setResult(null)
              syncUrl(null, null)
            }}
            placeholder="Search types…"
            emptyMessage="No types found."
            options={toComboboxOptions(types)}
          />
        </div>

        <div className="space-y-2">
          <Label>Cube 1</Label>
          <CubeCombobox
            cubes={leftOptions}
            value={leftId}
            disabled={!type || loadingCubes || bootstrapping}
            onValueChange={(value) => {
              setLeftId(value)
              syncUrl(value, rightId)
            }}
            placeholder={
              !type
                ? "Select a type first"
                : loadingCubes
                  ? "Loading…"
                  : "Search cubes…"
            }
          />
        </div>

        <div className="space-y-2">
          <Label>Cube 2</Label>
          <CubeCombobox
            cubes={rightOptions}
            value={rightId}
            disabled={!type || !leftId || loadingCubes || bootstrapping}
            onValueChange={(value) => {
              setRightId(value)
              syncUrl(leftId, value)
            }}
            placeholder={
              !type
                ? "Select a type first"
                : loadingCubes
                  ? "Loading…"
                  : "Search cubes…"
            }
          />
        </div>
      </div>

      {leftId && rightId && leftId === rightId ? (
        <p className="text-sm text-destructive">
          Pick two different cubes to compare.
        </p>
      ) : null}

      {loadingCompare ? (
        <p className="text-sm text-muted-foreground">Comparing…</p>
      ) : null}

      {displayResult ? (
        <div className="space-y-10">
          <section className="grid gap-6 md:grid-cols-2">
            {[displayResult.left, displayResult.right].map((side, index) => {
              const isFirst = index === 0
              const chartColor = isFirst
                ? "var(--chart-1)"
                : "var(--chart-2)"

              return (
                <Card
                  key={side.cube.id}
                  className={cn(
                    "overflow-hidden",
                    isFirst
                      ? "border-t-4 border-t-[color:var(--chart-1)]"
                      : "border-t-4 border-t-[color:var(--chart-2)]"
                  )}
                >
                  <CardHeader className="border-b">
                    <p className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                      {isFirst ? "Cube 1" : "Cube 2"}
                    </p>
                    <Link
                      href={`/cubes/${side.cube.id}`}
                      className="text-2xl font-bold tracking-tight transition-colors hover:text-primary"
                    >
                      {side.cube.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">
                      {side.cube.brand} · {side.cube.type}
                    </p>
                    <p className="text-sm">
                      <span className="text-2xl font-semibold tabular-nums text-primary">
                        {formatMetric(side.cube.metrics?.overall)}
                      </span>
                      <span className="ml-2 text-muted-foreground">
                        overall · {side.cube.reviewCount} reviews
                      </span>
                    </p>
                  </CardHeader>
                  <CardContent>
                    <MetricRadar
                      metrics={side.cube.metrics}
                      color={chartColor}
                    />
                  </CardContent>
                </Card>
              )
            })}
          </section>

          <section className="overflow-x-auto">
            <table className="w-full min-w-[28rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-4 font-medium">Metric</th>
                  <th className="py-2 pr-4 font-medium">
                    {displayResult.left.cube.name}
                  </th>
                  <th className="py-2 font-medium">
                    {displayResult.right.cube.name}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b">
                  <td className="py-2 pr-4 font-medium">Overall</td>
                  <td className="py-2 pr-4 tabular-nums">
                    {formatMetric(displayResult.left.cube.metrics?.overall)}
                  </td>
                  <td className="py-2 tabular-nums">
                    {formatMetric(displayResult.right.cube.metrics?.overall)}
                  </td>
                </tr>
                {METRIC_KEYS.map((key) => (
                  <tr key={key} className="border-b last:border-0">
                    <td className="py-2 pr-4">{METRIC_LABELS[key]}</td>
                    <td className="py-2 pr-4 tabular-nums">
                      {formatMetric(displayResult.left.cube.metrics?.[key])}
                    </td>
                    <td className="py-2 tabular-nums">
                      {formatMetric(displayResult.right.cube.metrics?.[key])}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {(displayResult.left.bestReview ||
            displayResult.left.worstReview ||
            displayResult.right.bestReview ||
            displayResult.right.worstReview) && (
            <>
              <Separator />
              <section className="space-y-6">
                <h2 className="text-lg font-semibold tracking-tight">
                  Highlighted reviews
                </h2>
                <div className="grid gap-6 md:grid-cols-2">
                  {[displayResult.left, displayResult.right].map((side) => (
                    <div key={`reviews-${side.cube.id}`} className="space-y-4">
                      <h3 className="font-medium">{side.cube.name}</h3>
                      {side.bestReview ? (
                        <blockquote className="space-y-1 border-l-2 border-primary/40 pl-3 text-sm">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Best
                          </p>
                          <p className="line-clamp-4 whitespace-pre-wrap">
                            {side.bestReview.writtenContent}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{side.bestReview.username}
                          </p>
                        </blockquote>
                      ) : null}
                      {side.worstReview ? (
                        <blockquote className="space-y-1 border-l-2 border-border pl-3 text-sm">
                          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                            Worst
                          </p>
                          <p className="line-clamp-4 whitespace-pre-wrap">
                            {side.worstReview.writtenContent}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            @{side.worstReview.username}
                          </p>
                        </blockquote>
                      ) : (
                        !side.bestReview && (
                          <p className="text-sm text-muted-foreground">
                            No reviews yet.
                          </p>
                        )
                      )}
                    </div>
                  ))}
                </div>
              </section>
            </>
          )}

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/cubes/${displayResult.left.cube.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View {displayResult.left.cube.name}
            </Link>
            <Link
              href={`/cubes/${displayResult.right.cube.id}`}
              className={cn(buttonVariants({ variant: "outline" }))}
            >
              View {displayResult.right.cube.name}
            </Link>
            <Button
              variant="ghost"
              onClick={() => {
                setLeftId(null)
                setRightId(null)
                setResult(null)
                syncUrl(null, null)
              }}
            >
              Reset
            </Button>
          </div>
        </div>
      ) : (
        !loadingCompare &&
        type &&
        leftId &&
        !rightId && (
          <p className="text-sm text-muted-foreground">
            Pick a second {type} to see the side-by-side comparison.
          </p>
        )
      )}
    </div>
  )
}
