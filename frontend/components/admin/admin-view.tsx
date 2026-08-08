"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { useCallback, useEffect, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Button, buttonVariants } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  approveAllStagingCubes,
  approveStagingCube,
  listStagingCubes,
  rejectAllStagingCubes,
  rejectStagingCube,
  runCatalogIngest,
} from "@/lib/api/client"
import {
  ApiError,
  type CatalogIngestResult,
  type CubeSummary,
} from "@/lib/types/api"
import { cn } from "@/lib/utils"

const PAGE_SIZE = 24

export function AdminView() {
  const router = useRouter()
  const { session, user, loading: authLoading } = useAuth()

  const [cubes, setCubes] = useState<CubeSummary[]>([])
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [busyId, setBusyId] = useState<number | null>(null)
  const [bulkBusy, setBulkBusy] = useState(false)
  const [rejectTarget, setRejectTarget] = useState<CubeSummary | null>(null)
  const [bulkAction, setBulkAction] = useState<"approve" | "reject" | null>(null)
  const [ingestOpen, setIngestOpen] = useState(false)
  const [ingesting, setIngesting] = useState(false)
  const [lastIngest, setLastIngest] = useState<CatalogIngestResult | null>(null)

  const actionsLocked = busyId !== null || bulkBusy || ingesting

  const token = session?.access_token
  const isAdmin = user?.role === "ADMIN"

  const loadStaging = useCallback(
    async (nextPage: number) => {
      if (!token) return

      setLoading(true)
      setError(null)
      try {
        const data = await listStagingCubes(token, {
          page: nextPage,
          size: PAGE_SIZE,
        })
        setCubes(data.items)
        setPage(data.page)
        setTotalPages(data.totalPages)
        setTotalElements(data.totalElements)
      } catch (err) {
        setCubes([])
        setError(
          err instanceof ApiError
            ? err.message
            : "Failed to load staging queue."
        )
      } finally {
        setLoading(false)
      }
    },
    [token]
  )

  useEffect(() => {
    if (authLoading) return

    if (!session) {
      router.replace("/auth?tab=login&next=/admin")
      return
    }

    if (!isAdmin) {
      router.replace("/home")
    }
  }, [authLoading, session, isAdmin, router])

  useEffect(() => {
    if (authLoading || !token || !isAdmin) return
    void loadStaging(0)
  }, [authLoading, token, isAdmin, loadStaging])

  async function handleApprove(cube: CubeSummary) {
    if (!token) return
    setBusyId(cube.id)
    try {
      await approveStagingCube(token, cube.id)
      toast.success(`Approved ${cube.name}`)
      const nextPage =
        cubes.length === 1 && page > 0 ? page - 1 : page
      await loadStaging(nextPage)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to approve cube."
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleReject() {
    if (!token || !rejectTarget) return
    const cube = rejectTarget
    setBusyId(cube.id)
    try {
      await rejectStagingCube(token, cube.id)
      toast.success(`Rejected ${cube.name}`)
      setRejectTarget(null)
      const nextPage =
        cubes.length === 1 && page > 0 ? page - 1 : page
      await loadStaging(nextPage)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to reject cube."
      )
    } finally {
      setBusyId(null)
    }
  }

  async function handleIngest() {
    if (!token) return
    setIngesting(true)
    try {
      const result = await runCatalogIngest(token)
      setLastIngest(result)
      setIngestOpen(false)
      toast.success(
        `Ingest finished: ${result.created} created, ${result.updated} updated`
      )
      await loadStaging(0)
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Catalog ingest failed."
      )
    } finally {
      setIngesting(false)
    }
  }

  async function handleBulkAction() {
    if (!token || !bulkAction) return
    setBulkBusy(true)
    try {
      const result =
        bulkAction === "approve"
          ? await approveAllStagingCubes(token)
          : await rejectAllStagingCubes(token)
      setBulkAction(null)
      toast.success(
        bulkAction === "approve"
          ? `Approved ${result.affected} cube${result.affected === 1 ? "" : "s"}`
          : `Rejected ${result.affected} cube${result.affected === 1 ? "" : "s"}`
      )
      await loadStaging(0)
    } catch (err) {
      toast.error(
        err instanceof ApiError
          ? err.message
          : bulkAction === "approve"
            ? "Failed to approve all staging cubes."
            : "Failed to reject all staging cubes."
      )
    } finally {
      setBulkBusy(false)
    }
  }

  if (authLoading || !session || !isAdmin) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-9 w-48" />
        <Skeleton className="h-10 w-full" />
        <Skeleton className="h-64 w-full" />
      </div>
    )
  }

  return (
    <div className="space-y-10">
      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Catalog ingest
            </h2>
            <p className="text-sm text-muted-foreground">
              Pull the latest products into staging from configured store
              collections.
            </p>
          </div>
          <Button onClick={() => setIngestOpen(true)} disabled={ingesting}>
            Run catalog ingest
          </Button>
        </div>

        {lastIngest ? (
          <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-4">
            <div>
              <dt className="text-muted-foreground">Created</dt>
              <dd className="font-medium tabular-nums">{lastIngest.created}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Updated</dt>
              <dd className="font-medium tabular-nums">{lastIngest.updated}</dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Products seen</dt>
              <dd className="font-medium tabular-nums">
                {lastIngest.productsSeen}
              </dd>
            </div>
            <div>
              <dt className="text-muted-foreground">Pages fetched</dt>
              <dd className="font-medium tabular-nums">
                {lastIngest.pagesFetched}
              </dd>
            </div>
            {lastIngest.warnings.length > 0 ? (
              <div className="col-span-full">
                <dt className="text-muted-foreground">Warnings</dt>
                <dd className="mt-1 space-y-1 text-destructive">
                  {lastIngest.warnings.map((warning) => (
                    <p key={warning}>{warning}</p>
                  ))}
                </dd>
              </div>
            ) : null}
          </dl>
        ) : null}
      </section>

      <section className="space-y-4">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div className="space-y-1">
            <h2 className="text-lg font-semibold tracking-tight">
              Staging queue
            </h2>
            <p className="text-sm text-muted-foreground">
              Approve cubes to make them LIVE, or reject to delete them.
              {totalElements > 0
                ? ` ${totalElements} pending.`
                : null}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button
              variant="outline"
              disabled={totalElements === 0 || actionsLocked || loading}
              onClick={() => setBulkAction("approve")}
            >
              Approve all
            </Button>
            <Button
              variant="destructive"
              disabled={totalElements === 0 || actionsLocked || loading}
              onClick={() => setBulkAction("reject")}
            >
              Reject all
            </Button>
          </div>
        </div>

        {error ? (
          <p className="text-sm text-destructive">{error}</p>
        ) : loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }, (_, i) => (
              <Skeleton key={i} className="h-12 w-full rounded-lg" />
            ))}
          </div>
        ) : cubes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            Staging is empty. Run catalog ingest to pull new cubes.
          </p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Cube</TableHead>
                <TableHead>Brand</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {cubes.map((cube) => {
                const busy = busyId === cube.id
                return (
                  <TableRow key={cube.id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {cube.imageUrl ? (
                          <img
                            src={cube.imageUrl}
                            alt=""
                            className="size-9 shrink-0 rounded object-cover"
                          />
                        ) : (
                          <div className="size-9 shrink-0 rounded bg-muted" />
                        )}
                        <div className="min-w-0">
                          <p className="font-medium">{cube.name}</p>
                          {cube.productUrl ? (
                            <a
                              href={cube.productUrl}
                              target="_blank"
                              rel="noreferrer"
                              className="text-xs text-muted-foreground hover:text-primary"
                            >
                              Product page
                            </a>
                          ) : (
                            <p className="text-xs text-muted-foreground">
                              ID {cube.id}
                            </p>
                          )}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{cube.brand}</TableCell>
                    <TableCell>{cube.type}</TableCell>
                    <TableCell className="text-right">
                      <div className="flex flex-wrap items-center justify-end gap-2">
                        <Button
                          size="sm"
                          disabled={actionsLocked}
                          onClick={() => void handleApprove(cube)}
                        >
                          {busy ? "…" : "Approve"}
                        </Button>
                        <Button
                          size="sm"
                          variant="destructive"
                          disabled={actionsLocked}
                          onClick={() => setRejectTarget(cube)}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        )}

        {totalPages > 1 ? (
          <div className="flex items-center justify-center gap-3">
            <Button
              variant="outline"
              size="sm"
              disabled={page <= 0 || loading}
              onClick={() => void loadStaging(page - 1)}
            >
              Previous
            </Button>
            <span className="text-sm tabular-nums text-muted-foreground">
              Page {page + 1} of {totalPages}
            </span>
            <Button
              variant="outline"
              size="sm"
              disabled={page + 1 >= totalPages || loading}
              onClick={() => void loadStaging(page + 1)}
            >
              Next
            </Button>
          </div>
        ) : null}

        <p className="text-sm text-muted-foreground">
          Need a LIVE cube?{" "}
          <Link
            href="/cubes"
            className={cn(buttonVariants({ variant: "link" }), "h-auto p-0")}
          >
            Browse catalog
          </Link>
        </p>
      </section>

      <AlertDialog
        open={rejectTarget !== null}
        onOpenChange={(open) => {
          if (!open && busyId === null) setRejectTarget(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject staging cube?</AlertDialogTitle>
            <AlertDialogDescription>
              {rejectTarget
                ? `This permanently deletes “${rejectTarget.name}” from staging. This cannot be undone.`
                : null}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={busyId !== null}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={busyId !== null}
              onClick={() => void handleReject()}
            >
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={ingestOpen}
        onOpenChange={(open) => {
          if (!ingesting) setIngestOpen(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Run catalog ingest?</AlertDialogTitle>
            <AlertDialogDescription>
              This fetches products from configured store collections and may
              take a while. New cubes land in staging for review.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={ingesting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              disabled={ingesting}
              onClick={() => void handleIngest()}
            >
              {ingesting ? "Running…" : "Run ingest"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <AlertDialog
        open={bulkAction !== null}
        onOpenChange={(open) => {
          if (!open && !bulkBusy) setBulkAction(null)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {bulkAction === "approve"
                ? "Approve all staging cubes?"
                : "Reject all staging cubes?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {bulkAction === "approve"
                ? `This makes all ${totalElements} staged cube${totalElements === 1 ? "" : "s"} LIVE.`
                : `This permanently deletes all ${totalElements} staged cube${totalElements === 1 ? "" : "s"}. This cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={bulkBusy}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant={bulkAction === "reject" ? "destructive" : "default"}
              disabled={bulkBusy}
              onClick={() => void handleBulkAction()}
            >
              {bulkBusy
                ? "Working…"
                : bulkAction === "approve"
                  ? "Approve all"
                  : "Reject all"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
