export type Role = "USER" | "ADMIN"

export type CubeStatus = "STAGING" | "LIVE"

export type Metrics = {
  speed: number
  stability: number
  turning: number
  customizability: number
  value: number
}

export type AggregateMetrics = Metrics & {
  overall: number
}

export type MeResponse = {
  id: string
  email: string
  username: string
  avatarUrl: string | null
  role: Role
  createdAt: string
  reviewCount: number
  rank: number
}

export type PageResponse<T> = {
  items: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
}

export type CubeSummary = {
  id: number
  name: string
  brand: string
  type: string
  status: CubeStatus
  imageUrl: string | null
  productUrl: string | null
  reviewCount: number | null
  metrics: AggregateMetrics | null
}

export type CubeDetail = {
  id: number
  name: string
  brand: string
  type: string
  status: CubeStatus
  imageUrl: string | null
  productUrl: string | null
  sourceStore: string | null
  shopifyProductId: number | null
  createdAt: string
  updatedAt: string
  reviewCount: number
  metrics: AggregateMetrics | null
}

export type CubeMeta = {
  types: string[]
  brands: string[]
}

export type Review = {
  id: number
  cubeId: number
  cubeName: string
  cubeType: string
  userId: string
  username: string
  avatarUrl: string | null
  writtenContent: string
  youtubeUrl: string | null
  metrics: Metrics | null
  createdAt: string
  updatedAt: string
}

export type CubeCompareSide = {
  cube: CubeDetail
  bestReview: Review | null
  worstReview: Review | null
}

export type CubeCompare = {
  left: CubeCompareSide
  right: CubeCompareSide
}

export type CreateReviewBody = {
  cubeId: number
  writtenContent: string
  youtubeUrl?: string | null
  metrics: {
    speed: number
    stability: number
    turning: number
    customizability: number
    value: number
  }
}

export type ApiErrorBody = {
  message?: string
  error?: string
}

export class ApiError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
    this.name = "ApiError"
  }
}
