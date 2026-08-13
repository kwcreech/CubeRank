import { getApiBaseUrl } from "@/lib/api"
import {
  ApiError,
  type ApiErrorBody,
  type AssistantQueryResponse,
  type BulkStagingResult,
  type CatalogIngestResult,
  type CreateReviewBody,
  type EmbeddingBackfillResult,
  type CubeCompare,
  type CubeDetail,
  type CubeLeaderboardEntry,
  type CubeMeta,
  type CubePicker,
  type CubeSummary,
  type MeResponse,
  type PageResponse,
  type PublicProfile,
  type Review,
  type UserLeaderboardEntry,
} from "@/lib/types/api"

type FetchOptions = Omit<RequestInit, "body"> & {
  token?: string | null
  body?: unknown
}

function toQuery(params: Record<string, string | number | undefined | null>) {
  const search = new URLSearchParams()
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue
    search.set(key, String(value))
  }
  const qs = search.toString()
  return qs ? `?${qs}` : ""
}

export async function apiFetch<T>(
  path: string,
  { token, body, headers, ...init }: FetchOptions = {}
): Promise<T> {
  const response = await fetch(`${getApiBaseUrl()}${path}`, {
    ...init,
    headers: {
      ...(body !== undefined ? { "Content-Type": "application/json" } : {}),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...headers,
    },
    body: body !== undefined ? JSON.stringify(body) : undefined,
  })

  if (!response.ok) {
    let message = response.statusText
    let retryAfterSeconds: number | undefined
    try {
      const payload = (await response.json()) as ApiErrorBody
      message = payload.message ?? payload.error ?? message
      if (typeof payload.retryAfterSeconds === "number") {
        retryAfterSeconds = payload.retryAfterSeconds
      }
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(response.status, message, retryAfterSeconds)
  }

  if (response.status === 204) {
    return undefined as T
  }

  return (await response.json()) as T
}

export function getMe(token: string) {
  return apiFetch<MeResponse>("/api/me", { token })
}

export function updateMe(
  token: string,
  body: { username?: string; avatarUrl?: string | null }
) {
  return apiFetch<MeResponse>("/api/me", {
    method: "PATCH",
    token,
    body,
  })
}

export function listCubes(params: {
  q?: string
  type?: string
  brand?: string
  page?: number
  size?: number
} = {}) {
  return apiFetch<PageResponse<CubeSummary>>(
    `/api/cubes${toQuery(params)}`,
    { cache: "no-store" }
  )
}

export function listCubePicker(type: string) {
  return apiFetch<CubePicker[]>(`/api/cubes/picker${toQuery({ type })}`, {
    cache: "no-store",
  })
}

export function getCubeMeta() {
  return apiFetch<CubeMeta>("/api/cubes/meta", { cache: "no-store" })
}

export function getCube(id: number | string) {
  return apiFetch<CubeDetail>(`/api/cubes/${id}`, { cache: "no-store" })
}

export function compareCubes(leftId: number | string, rightId: number | string) {
  return apiFetch<CubeCompare>(
    `/api/cubes/compare${toQuery({ leftId, rightId })}`,
    { cache: "no-store" }
  )
}

export function listCubeReviews(
  cubeId: number | string,
  params: { page?: number; size?: number } = {}
) {
  return apiFetch<PageResponse<Review>>(
    `/api/reviews/cube/${cubeId}${toQuery(params)}`,
    { cache: "no-store" }
  )
}

export function listRecentReviews(params: { page?: number; size?: number } = {}) {
  return apiFetch<PageResponse<Review>>(
    `/api/reviews/recent${toQuery(params)}`,
    { cache: "no-store" }
  )
}

export function createReview(token: string, body: CreateReviewBody) {
  return apiFetch<Review>("/api/reviews", {
    method: "POST",
    token,
    body,
  })
}

export function getCubeLeaderboard(params: {
  type?: string
  brand?: string
  sortBy?: string
  page?: number
  size?: number
} = {}) {
  return apiFetch<PageResponse<CubeLeaderboardEntry>>(
    `/api/leaderboards/cubes${toQuery(params)}`,
    { cache: "no-store" }
  )
}

export function getUserLeaderboard(params: {
  page?: number
  size?: number
} = {}) {
  return apiFetch<PageResponse<UserLeaderboardEntry>>(
    `/api/leaderboards/users${toQuery(params)}`,
    { cache: "no-store" }
  )
}

export function getPublicProfile(
  username: string,
  params: { page?: number; size?: number } = {}
) {
  return apiFetch<PublicProfile>(
    `/api/users/${encodeURIComponent(username)}${toQuery(params)}`,
    { cache: "no-store" }
  )
}

export function listStagingCubes(
  token: string,
  params: { page?: number; size?: number } = {}
) {
  return apiFetch<PageResponse<CubeSummary>>(
    `/api/admin/cubes/staging${toQuery(params)}`,
    { token, cache: "no-store" }
  )
}

export function approveStagingCube(token: string, id: number | string) {
  return apiFetch<CubeDetail>(`/api/admin/cubes/${id}/approve`, {
    method: "POST",
    token,
  })
}

export function rejectStagingCube(token: string, id: number | string) {
  return apiFetch<void>(`/api/admin/cubes/${id}`, {
    method: "DELETE",
    token,
  })
}

export function approveAllStagingCubes(token: string) {
  return apiFetch<BulkStagingResult>("/api/admin/cubes/staging/approve-all", {
    method: "POST",
    token,
  })
}

export function rejectAllStagingCubes(token: string) {
  return apiFetch<BulkStagingResult>("/api/admin/cubes/staging/reject-all", {
    method: "POST",
    token,
  })
}

export function runCatalogIngest(token: string) {
  return apiFetch<CatalogIngestResult>("/api/admin/catalog/ingest", {
    method: "POST",
    token,
  })
}

export function runEmbeddingBackfill(token: string) {
  return apiFetch<EmbeddingBackfillResult>("/api/admin/embeddings/backfill", {
    method: "POST",
    token,
  })
}

export function queryAssistant(token: string, prompt: string) {
  return apiFetch<AssistantQueryResponse>("/api/assistant/query", {
    method: "POST",
    token,
    body: { prompt },
  })
}
