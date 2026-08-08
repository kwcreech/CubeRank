"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState } from "react"
import { toast } from "sonner"

import { MetricRadar } from "@/components/charts/metric-radar"
import { Button, buttonVariants } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Separator } from "@/components/ui/separator"
import {
  compareCubes,
  getCube,
  getCubeMeta,
  listCubes,
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
        const data = await listCubes({ type: type ?? undefined, size: 100 })
        if (cancelled) return
        setCubes(data.items)
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
          <Select
            value={type}
            disabled={bootstrapping}
            onValueChange={(value) => {
              setType(value)
              setLeftId(null)
              setRightId(null)
              setResult(null)
              syncUrl(null, null)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select a type" />
            </SelectTrigger>
            <SelectContent>
              {types.map((item) => (
                <SelectItem key={item} value={item}>
                  {item}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Left cube</Label>
          <Select
            value={leftId}
            disabled={!type || loadingCubes || bootstrapping}
            onValueChange={(value) => {
              setLeftId(value)
              syncUrl(value, rightId)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  loadingCubes ? "Loading…" : "Select left cube"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {leftOptions.map((cube) => (
                <SelectItem key={cube.id} value={String(cube.id)}>
                  {cube.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Right cube</Label>
          <Select
            value={rightId}
            disabled={!type || loadingCubes || bootstrapping}
            onValueChange={(value) => {
              setRightId(value)
              syncUrl(leftId, value)
            }}
          >
            <SelectTrigger className="w-full">
              <SelectValue
                placeholder={
                  leftId
                    ? loadingCubes
                      ? "Loading…"
                      : "Select right cube"
                    : "Select left cube first"
                }
              />
            </SelectTrigger>
            <SelectContent>
              {rightOptions.map((cube) => (
                <SelectItem key={cube.id} value={String(cube.id)}>
                  {cube.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
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
          <section className="grid gap-8 md:grid-cols-2">
            {[displayResult.left, displayResult.right].map((side, index) => (
              <div key={side.cube.id} className="space-y-4">
                <div className="space-y-1">
                  <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
                    {index === 0 ? "Left" : "Right"}
                  </p>
                  <Link
                    href={`/cubes/${side.cube.id}`}
                    className="text-xl font-semibold tracking-tight hover:text-primary"
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
                </div>
                <MetricRadar
                  metrics={side.cube.metrics}
                  color={
                    index === 0 ? "var(--chart-1)" : "var(--chart-2)"
                  }
                />
              </div>
            ))}
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
