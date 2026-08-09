"use client"

import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { CubeCard } from "@/components/cubes/cube-card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  OptionCombobox,
  toComboboxOptions,
} from "@/components/ui/option-combobox"
import { Skeleton } from "@/components/ui/skeleton"
import { getCubeMeta, listCubes } from "@/lib/api/client"
import { ApiError, type CubeMeta, type CubeSummary } from "@/lib/types/api"

const PAGE_SIZE = 16
const ALL = "__all__"

export function CubesBrowse() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [pending, startTransition] = useTransition()

  const q = searchParams.get("q") ?? ""
  const type = searchParams.get("type") ?? ""
  const brand = searchParams.get("brand") ?? ""
  const page = Math.max(0, Number(searchParams.get("page") ?? "0") || 0)

  const [draftQ, setDraftQ] = useState<string | null>(null)
  const searchInput = draftQ ?? q
  const [meta, setMeta] = useState<CubeMeta | null>(null)
  const [cubes, setCubes] = useState<CubeSummary[]>([])
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const data = await getCubeMeta()
        if (!cancelled) setMeta(data)
      } catch {
        if (!cancelled) setMeta({ types: [], brands: [] })
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function load() {
      setLoading(true)
      setError(null)
      try {
        const data = await listCubes({
          q: q || undefined,
          type: type || undefined,
          brand: brand || undefined,
          page,
          size: PAGE_SIZE,
        })
        if (cancelled) return
        setCubes(data.items)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } catch (err) {
        if (cancelled) return
        setCubes([])
        setError(
          err instanceof ApiError ? err.message : "Failed to load cubes."
        )
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void load()
    return () => {
      cancelled = true
    }
  }, [q, type, brand, page])

  function updateParams(next: {
    q?: string
    type?: string
    brand?: string
    page?: number
  }) {
    const params = new URLSearchParams(searchParams.toString())
    const values = {
      q: next.q !== undefined ? next.q : q,
      type: next.type !== undefined ? next.type : type,
      brand: next.brand !== undefined ? next.brand : brand,
      page: next.page !== undefined ? next.page : page,
    }

    for (const [key, value] of Object.entries(values)) {
      if (value === "" || value === 0 || value === ALL) {
        if (key === "page" && value === 0) params.delete(key)
        else if (key !== "page") params.delete(key)
        else params.set(key, String(value))
      } else {
        params.set(key, String(value))
      }
    }

    if (next.q !== undefined || next.type !== undefined || next.brand !== undefined) {
      params.delete("page")
    }

    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `/cubes?${qs}` : "/cubes")
    })
  }

  return (
    <div className="space-y-8">
      <form
        className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4"
        onSubmit={(event) => {
          event.preventDefault()
          const nextQ = searchInput.trim()
          setDraftQ(null)
          updateParams({ q: nextQ, page: 0 })
        }}
      >
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="cube-search">Search</Label>
          <div className="flex gap-2">
            <Input
              id="cube-search"
              value={searchInput}
              onChange={(event) => setDraftQ(event.target.value)}
              placeholder="Search by name…"
            />
            <Button type="submit" disabled={pending}>
              Search
            </Button>
          </div>
        </div>

        <div className="space-y-2">
          <Label>Type</Label>
          <OptionCombobox
            value={type || ALL}
            onValueChange={(value) =>
              updateParams({
                type: !value || value === ALL ? "" : value,
                page: 0,
              })
            }
            placeholder="All types"
            emptyMessage="No types found."
            options={[
              { value: ALL, label: "All types" },
              ...toComboboxOptions(meta?.types ?? []),
            ]}
          />
        </div>

        <div className="space-y-2">
          <Label>Brand</Label>
          <OptionCombobox
            value={brand || ALL}
            onValueChange={(value) =>
              updateParams({
                brand: !value || value === ALL ? "" : value,
                page: 0,
              })
            }
            placeholder="All brands"
            emptyMessage="No brands found."
            options={[
              { value: ALL, label: "All brands" },
              ...toComboboxOptions(meta?.brands ?? []),
            ]}
          />
        </div>
      </form>

      <div className="flex items-center justify-between gap-4 text-sm text-muted-foreground">
        <p>
          {loading
            ? "Loading…"
            : `${totalElements} cube${totalElements === 1 ? "" : "s"}`}
        </p>
        {(q || type || brand) && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => {
              setDraftQ(null)
              startTransition(() => router.replace("/cubes"))
            }}
          >
            Clear filters
          </Button>
        )}
      </div>

      {totalPages > 1 ? (
        <PageNavigator
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPrevious={() => updateParams({ page: page - 1 })}
          onNext={() => updateParams({ page: page + 1 })}
        />
      ) : null}

      {error ? (
        <p className="text-sm text-destructive">{error}</p>
      ) : loading ? (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }, (_, i) => (
            <Skeleton key={i} className="aspect-[4/3] w-full rounded-xl" />
          ))}
        </div>
      ) : cubes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No cubes match these filters.
        </p>
      ) : (
        <div className="grid gap-3 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4">
          {cubes.map((cube) => (
            <CubeCard key={cube.id} cube={cube} compact />
          ))}
        </div>
      )}

      {totalPages > 1 ? (
        <PageNavigator
          page={page}
          totalPages={totalPages}
          loading={loading}
          onPrevious={() => updateParams({ page: page - 1 })}
          onNext={() => updateParams({ page: page + 1 })}
        />
      ) : null}
    </div>
  )
}

function PageNavigator({
  page,
  totalPages,
  loading,
  onPrevious,
  onNext,
}: {
  page: number
  totalPages: number
  loading: boolean
  onPrevious: () => void
  onNext: () => void
}) {
  return (
    <div className="flex items-center justify-center gap-3">
      <Button
        variant="outline"
        size="sm"
        disabled={page <= 0 || loading}
        onClick={onPrevious}
      >
        Previous
      </Button>
      <span className="text-sm text-muted-foreground tabular-nums">
        Page {page + 1} of {totalPages}
      </span>
      <Button
        variant="outline"
        size="sm"
        disabled={page + 1 >= totalPages || loading}
        onClick={onNext}
      >
        Next
      </Button>
    </div>
  )
}
