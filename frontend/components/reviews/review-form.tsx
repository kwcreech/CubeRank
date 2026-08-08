"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { Button, buttonVariants } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Slider } from "@/components/ui/slider"
import { Textarea } from "@/components/ui/textarea"
import {
  createReview,
  getCube,
  getCubeMeta,
  listCubes,
} from "@/lib/api/client"
import {
  METRIC_DESCRIPTORS,
  METRIC_KEYS,
  METRIC_LABELS,
  type MetricKey,
} from "@/lib/metrics"
import { ApiError, type CubeSummary } from "@/lib/types/api"
import { cn } from "@/lib/utils"

const DEFAULT_METRICS = Object.fromEntries(
  METRIC_KEYS.map((key) => [key, 5])
) as Record<MetricKey, number>

export function ReviewForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const prefillCubeId = searchParams.get("cubeId")
  const { session, loading: authLoading } = useAuth()

  const [types, setTypes] = useState<string[]>([])
  const [cubes, setCubes] = useState<CubeSummary[]>([])
  const [type, setType] = useState<string | null>(null)
  const [cubeId, setCubeId] = useState<string | null>(prefillCubeId)
  const [lockedCube, setLockedCube] = useState<CubeSummary | null>(null)
  const [metrics, setMetrics] = useState(DEFAULT_METRICS)
  const [writtenContent, setWrittenContent] = useState("")
  const [youtubeUrl, setYoutubeUrl] = useState("")
  const [submitting, setSubmitting] = useState(false)
  const [loadingCubes, setLoadingCubes] = useState(false)

  useEffect(() => {
    if (!authLoading && !session) {
      const next = `/review${prefillCubeId ? `?cubeId=${prefillCubeId}` : ""}`
      router.replace(`/auth?tab=login&next=${encodeURIComponent(next)}`)
    }
  }, [authLoading, session, router, prefillCubeId])

  useEffect(() => {
    let cancelled = false

    async function loadPrefill() {
      if (!prefillCubeId) return
      try {
        const cube = await getCube(prefillCubeId)
        if (cancelled) return
        setLockedCube({
          id: cube.id,
          name: cube.name,
          brand: cube.brand,
          type: cube.type,
          status: cube.status,
          imageUrl: cube.imageUrl,
          productUrl: cube.productUrl,
          reviewCount: cube.reviewCount,
          metrics: cube.metrics,
        })
        setType(cube.type)
        setCubeId(String(cube.id))
      } catch (err) {
        if (!cancelled) {
          toast.error(
            err instanceof ApiError ? err.message : "Could not load cube."
          )
        }
      }
    }

    void loadPrefill()
    return () => {
      cancelled = true
    }
  }, [prefillCubeId])

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
    if (lockedCube || !type) return

    let cancelled = false

    async function loadTypeCubes() {
      setLoadingCubes(true)
      try {
        const data = await listCubes({ type: type ?? undefined, size: 100 })
        if (cancelled) return
        setCubes(data.items)
        setCubeId((current) => {
          if (current && data.items.some((c) => String(c.id) === current)) {
            return current
          }
          return null
        })
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
  }, [type, lockedCube])

  const selectableCubes = lockedCube || !type ? [] : cubes

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.access_token) return

    if (!cubeId) {
      toast.error("Select a cube to review.")
      return
    }

    const content = writtenContent.trim()
    if (!content) {
      toast.error("Write a review before submitting.")
      return
    }

    setSubmitting(true)
    try {
      await createReview(session.access_token, {
        cubeId: Number(cubeId),
        writtenContent: content,
        youtubeUrl: youtubeUrl.trim() || null,
        metrics: {
          speed: metrics.speed,
          stability: metrics.stability,
          turning: metrics.turning,
          customizability: metrics.customizability,
          value: metrics.value,
        },
      })
      toast.success("Review submitted.")
      router.push(`/cubes/${cubeId}`)
      router.refresh()
    } catch (err) {
      if (err instanceof ApiError && err.status === 409) {
        toast.error("You already reviewed this cube.")
      } else {
        toast.error(
          err instanceof ApiError ? err.message : "Failed to submit review."
        )
      }
    } finally {
      setSubmitting(false)
    }
  }

  if (authLoading || !session) {
    return (
      <p className="text-sm text-muted-foreground">Checking your session…</p>
    )
  }

  return (
    <form onSubmit={handleSubmit} className="mx-auto max-w-2xl space-y-8">
      <div className="space-y-4">
        {lockedCube ? (
          <div className="rounded-xl bg-muted/50 px-4 py-3 ring-1 ring-foreground/10">
            <p className="text-sm text-muted-foreground">Reviewing</p>
            <p className="font-medium">
              {lockedCube.name}{" "}
              <span className="text-muted-foreground">
                · {lockedCube.brand} · {lockedCube.type}
              </span>
            </p>
            <Link
              href="/review"
              className={cn(
                buttonVariants({ variant: "link", size: "sm" }),
                "mt-1 h-auto px-0"
              )}
            >
              Choose a different cube
            </Link>
          </div>
        ) : (
          <>
            <div className="space-y-2">
              <Label>Cube type</Label>
              <Select
                value={type}
                onValueChange={(value) => {
                  setType(value)
                  setCubeId(null)
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
              <Label>Cube</Label>
              <Select
                value={cubeId}
                onValueChange={setCubeId}
                disabled={!type || loadingCubes}
              >
                <SelectTrigger className="w-full">
                  <SelectValue
                    placeholder={
                      !type
                        ? "Select a type first"
                        : loadingCubes
                          ? "Loading cubes…"
                          : "Select a cube"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {selectableCubes.map((cube) => (
                    <SelectItem key={cube.id} value={String(cube.id)}>
                      {cube.name} · {cube.brand}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </>
        )}
      </div>

      <div className="space-y-6">
        <h2 className="text-lg font-semibold tracking-tight">Metrics</h2>
        {METRIC_KEYS.map((key) => (
          <div key={key} className="space-y-3">
            <div className="flex items-baseline justify-between gap-3">
              <Label htmlFor={`metric-${key}`}>{METRIC_LABELS[key]}</Label>
              <span className="text-sm font-semibold tabular-nums text-primary">
                {metrics[key]}
              </span>
            </div>
            <Slider
              id={`metric-${key}`}
              min={1}
              max={10}
              step={1}
              value={[metrics[key]]}
              onValueChange={(value) =>
                setMetrics((current) => ({
                  ...current,
                  [key]: Array.isArray(value) ? value[0] : value,
                }))
              }
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>{METRIC_DESCRIPTORS[key].low}</span>
              <span>{METRIC_DESCRIPTORS[key].high}</span>
            </div>
          </div>
        ))}
      </div>

      <div className="space-y-2">
        <Label htmlFor="written-content">Written review</Label>
        <Textarea
          id="written-content"
          required
          minLength={1}
          maxLength={10000}
          rows={6}
          value={writtenContent}
          onChange={(event) => setWrittenContent(event.target.value)}
          placeholder="How does it feel? Setup tips, strengths, quirks…"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="youtube-url">YouTube link (optional)</Label>
        <Input
          id="youtube-url"
          type="url"
          value={youtubeUrl}
          onChange={(event) => setYoutubeUrl(event.target.value)}
          placeholder="https://www.youtube.com/watch?v=…"
        />
      </div>

      <Button type="submit" size="lg" disabled={submitting || !cubeId}>
        {submitting ? "Submitting…" : "Submit review"}
      </Button>
    </form>
  )
}
