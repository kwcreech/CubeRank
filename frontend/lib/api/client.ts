import { getApiBaseUrl } from "@/lib/api"
import {
  ApiError,
  type ApiErrorBody,
  type CreateReviewBody,
  type CubeCompare,
  type CubeDetail,
  type CubeMeta,
  type CubeSummary,
  type MeResponse,
  type PageResponse,
  type Review,
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
    try {
      const payload = (await response.json()) as ApiErrorBody
      message = payload.message ?? payload.error ?? message
    } catch {
      // ignore non-JSON error bodies
    }
    throw new ApiError(response.status, message)
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

export function createReview(token: string, body: CreateReviewBody) {
  return apiFetch<Review>("/api/reviews", {
    method: "POST",
    token,
    body,
  })
}
