export type Role = "USER" | "ADMIN"

export type CubeStatus = "STAGING" | "LIVE"

export type Metrics = {
  controllability: number
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

export type CubePicker = {
  id: number
  name: string
  brand: string
  type: string
  baseName: string
  versionLabel: string
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
    controllability: number
    stability: number
    turning: number
    customizability: number
    value: number
  }
}

export type CubeLeaderboardEntry = {
  rank: number
  cubeId: number
  name: string
  brand: string
  type: string
  imageUrl: string | null
  reviewCount: number
  rawAverage: number
  bayesianScore: number
  metrics: AggregateMetrics
}

export type UserLeaderboardEntry = {
  rank: number
  userId: string
  username: string
  avatarUrl: string | null
  reviewCount: number
}

export type ProfileReviewItem = {
  reviewId: number
  cubeId: number
  cubeName: string
  cubeType: string
  cubeBrand: string
  writtenContent: string | null
  youtubeUrl: string | null
  metrics: Metrics | null
  createdAt: string
}

export type TopCubeItem = {
  cubeId: number
  cubeName: string
  cubeBrand: string
  cubeType: string
  personalAverage: number
  metrics: Metrics
}

export type PublicProfile = {
  username: string
  avatarUrl: string | null
  reviewCount: number
  rank: number
  reviews: PageResponse<ProfileReviewItem>
  topCubesByType: Record<string, TopCubeItem[]>
}

export type CatalogIngestResult = {
  collectionsProcessed: number
  pagesFetched: number
  productsSeen: number
  created: number
  updated: number
  skippedBlocked: number
  skippedDuplicates: number
  warnings: string[]
}

export type BulkStagingResult = {
  affected: number
}

export type EmbeddingBackfillResult = {
  attempted: number
  embedded: number
  failed: number
  warnings: string[]
}

export type AssistantCitation = {
  reviewId: number
  cubeId: number
  cubeName: string
  excerpt: string
}

export type AssistantQueryResponse = {
  answer: string
  citations: AssistantCitation[]
  remainingQuota: number
  retryAfterSeconds: number | null
}

export type ApiErrorBody = {
  message?: string
  error?: string
  retryAfterSeconds?: number
}

export class ApiError extends Error {
  status: number
  retryAfterSeconds?: number

  constructor(status: number, message: string, retryAfterSeconds?: number) {
    super(message)
    this.status = status
    this.retryAfterSeconds = retryAfterSeconds
    this.name = "ApiError"
  }
}
