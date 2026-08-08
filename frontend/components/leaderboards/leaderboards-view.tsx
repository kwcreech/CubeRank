"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { useEffect, useState, useTransition } from "react"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import {
  OptionCombobox,
  toComboboxOptions,
} from "@/components/ui/option-combobox"
import { Skeleton } from "@/components/ui/skeleton"
import {
  getCubeLeaderboard,
  getCubeMeta,
  getUserLeaderboard,
} from "@/lib/api/client"
import {
  formatMetric,
  SORT_METRIC_KEYS,
  SORT_METRIC_LABELS,
  type SortMetricKey,
} from "@/lib/metrics"
import {
  ApiError,
  type CubeLeaderboardEntry,
  type UserLeaderboardEntry,
} from "@/lib/types/api"

const DEFAULT_TYPE = "3x3"
const DEFAULT_SORT: SortMetricKey = "overall"
const PAGE_SIZE = 25

function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

function isSortMetric(value: string): value is SortMetricKey {
  return (SORT_METRIC_KEYS as readonly string[]).includes(value)
}

export function LeaderboardsView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [, startTransition] = useTransition()

  const type = searchParams.get("type") || DEFAULT_TYPE
  const sortParam = searchParams.get("sortBy") || DEFAULT_SORT
  const sortBy = isSortMetric(sortParam) ? sortParam : DEFAULT_SORT
  const page = Math.max(0, Number(searchParams.get("page") ?? "0") || 0)

  const [types, setTypes] = useState<string[]>([])
  const [cubes, setCubes] = useState<CubeLeaderboardEntry[]>([])
  const [users, setUsers] = useState<UserLeaderboardEntry[]>([])
  const [cubeTotalPages, setCubeTotalPages] = useState(0)
  const [loadingCubes, setLoadingCubes] = useState(true)
  const [loadingUsers, setLoadingUsers] = useState(true)
  const [cubeError, setCubeError] = useState<string | null>(null)
  const [userError, setUserError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    async function loadMeta() {
      try {
        const meta = await getCubeMeta()
        if (cancelled) return
        const nextTypes = meta.types.includes(DEFAULT_TYPE)
          ? meta.types
          : [DEFAULT_TYPE, ...meta.types]
        setTypes(nextTypes)
      } catch {
        if (!cancelled) setTypes([DEFAULT_TYPE])
      }
    }

    void loadMeta()
    return () => {
      cancelled = true
    }
  }, [])

  useEffect(() => {
    let cancelled = false

    async function loadCubes() {
      setLoadingCubes(true)
      setCubeError(null)
      try {
        const data = await getCubeLeaderboard({
          type,
          sortBy,
          page,
          size: PAGE_SIZE,
        })
        if (cancelled) return
        setCubes(data.items)
        setCubeTotalPages(data.totalPages)
      } catch (err) {
        if (cancelled) return
        setCubes([])
        setCubeError(
          err instanceof ApiError
            ? err.message
            : "Failed to load cube leaderboard."
        )
      } finally {
        if (!cancelled) setLoadingCubes(false)
      }
    }

    void loadCubes()
    return () => {
      cancelled = true
    }
  }, [type, sortBy, page])

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      setLoadingUsers(true)
      setUserError(null)
      try {
        const data = await getUserLeaderboard({ page: 0, size: 10 })
        if (cancelled) return
        setUsers(data.items)
      } catch (err) {
        if (cancelled) return
        setUsers([])
        setUserError(
          err instanceof ApiError
            ? err.message
            : "Failed to load user leaderboard."
        )
      } finally {
        if (!cancelled) setLoadingUsers(false)
      }
    }

    void loadUsers()
    return () => {
      cancelled = true
    }
  }, [])

  function updateFilters(next: {
    type?: string
    sortBy?: string
    page?: number
  }) {
    const params = new URLSearchParams()
    const nextType = next.type ?? type
    const nextSort = next.sortBy ?? sortBy
    const resetPage = next.type !== undefined || next.sortBy !== undefined
    const nextPage = resetPage ? 0 : (next.page ?? page)

    if (nextType !== DEFAULT_TYPE) params.set("type", nextType)
    if (nextSort !== DEFAULT_SORT) params.set("sortBy", nextSort)
    if (nextPage > 0) params.set("page", String(nextPage))

    const qs = params.toString()
    startTransition(() => {
      router.replace(qs ? `/leaderboards?${qs}` : "/leaderboards")
    })
  }

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,1.6fr)_minmax(16rem,0.8fr)]">
      <section className="space-y-6">
        <div className="flex flex-wrap items-end gap-4">
          <div className="space-y-2">
            <Label>Type</Label>
            <OptionCombobox
              className="w-40"
              value={type}
              onValueChange={(value) => {
                if (value) updateFilters({ type: value, page: 0 })
              }}
              placeholder="Search types…"
              emptyMessage="No types found."
              options={toComboboxOptions(types.length ? types : [type])}
            />
          </div>

          <div className="space-y-2">
            <Label>Metric</Label>
            <OptionCombobox
              className="w-44"
              value={sortBy}
              onValueChange={(value) => {
                if (value && isSortMetric(value)) {
                  updateFilters({ sortBy: value, page: 0 })
                }
              }}
              placeholder="Search metrics…"
              emptyMessage="No metrics found."
              options={SORT_METRIC_KEYS.map((key) => ({
                value: key,
                label: SORT_METRIC_LABELS[key],
              }))}
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          {cubeError ? (
            <p className="text-sm text-destructive">{cubeError}</p>
          ) : loadingCubes ? (
            <div className="space-y-3">
              {Array.from({ length: 8 }, (_, i) => (
                <Skeleton key={i} className="h-12 w-full rounded-lg" />
              ))}
            </div>
          ) : cubes.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No ranked {type} cubes yet.
            </p>
          ) : (
            <table className="w-full min-w-[32rem] text-sm">
              <thead>
                <tr className="border-b text-left text-muted-foreground">
                  <th className="py-2 pr-3 font-medium">#</th>
                  <th className="py-2 pr-3 font-medium">Cube</th>
                  <th className="py-2 pr-3 font-medium">
                    {SORT_METRIC_LABELS[sortBy]}
                  </th>
                  <th className="py-2 font-medium">Reviews</th>
                </tr>
              </thead>
              <tbody>
                {cubes.map((entry) => {
                  const score =
                    sortBy === "overall"
                      ? entry.metrics.overall
                      : entry.metrics[sortBy]

                  return (
                    <tr key={entry.cubeId} className="border-b last:border-0">
                      <td className="py-3 pr-3 tabular-nums text-muted-foreground">
                        {entry.rank}
                      </td>
                      <td className="py-3 pr-3">
                        <Link
                          href={`/cubes/${entry.cubeId}`}
                          className="font-medium hover:text-primary"
                        >
                          {entry.name}
                        </Link>
                        <p className="text-xs text-muted-foreground">
                          {entry.brand}
                        </p>
                      </td>
                      <td className="py-3 pr-3 tabular-nums font-medium">
                        {formatMetric(score)}
                      </td>
                      <td className="py-3 tabular-nums text-muted-foreground">
                        {entry.reviewCount}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>

        {cubeTotalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0 || loadingCubes}
              onClick={() => updateFilters({ page: page - 1 })}
            >
              Previous
            </Button>
            <span className="text-sm text-muted-foreground tabular-nums">
              Page {page + 1} of {cubeTotalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= cubeTotalPages || loadingCubes}
              onClick={() => updateFilters({ page: page + 1 })}
            >
              Next
            </Button>
          </div>
        ) : null}
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Top users</h2>
          <p className="text-sm text-muted-foreground">
            Ranked by review count
          </p>
        </div>

        {userError ? (
          <p className="text-sm text-destructive">{userError}</p>
        ) : loadingUsers ? (
          <div className="space-y-3">
            {Array.from({ length: 5 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : users.length === 0 ? (
          <p className="text-sm text-muted-foreground">No contributors yet.</p>
        ) : (
          <ol className="divide-y divide-border">
            {users.map((entry) => (
              <li key={entry.userId} className="flex items-center gap-3 py-3">
                <span className="w-6 text-sm tabular-nums text-muted-foreground">
                  {entry.rank}
                </span>
                <Avatar size="sm">
                  {entry.avatarUrl ? (
                    <AvatarImage
                      src={entry.avatarUrl}
                      alt={entry.username}
                    />
                  ) : null}
                  <AvatarFallback>{initials(entry.username)}</AvatarFallback>
                </Avatar>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/users/${encodeURIComponent(entry.username)}`}
                    className="font-medium hover:text-primary"
                  >
                    @{entry.username}
                  </Link>
                  <p className="text-xs text-muted-foreground">
                    {entry.reviewCount} review
                    {entry.reviewCount === 1 ? "" : "s"}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        )}
      </section>
    </div>
  )
}
