import Link from "next/link"

import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { formatMetric, METRIC_KEYS, METRIC_LABELS } from "@/lib/metrics"
import type { Review } from "@/lib/types/api"

function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

export function ReviewList({
  reviews,
  emptyMessage = "No reviews yet.",
  showCube = false,
}: {
  reviews: Review[]
  emptyMessage?: string
  /** When true, show a link to the reviewed cube (home feed). */
  showCube?: boolean
}) {
  if (reviews.length === 0) {
    return <p className="text-sm text-muted-foreground">{emptyMessage}</p>
  }

  return (
    <ul className="divide-y divide-border">
      {reviews.map((review) => (
        <li key={review.id} className="py-5 first:pt-0 last:pb-0">
          <div className="flex items-start gap-3">
            <Avatar size="sm">
              {review.avatarUrl ? (
                <AvatarImage src={review.avatarUrl} alt={review.username} />
              ) : null}
              <AvatarFallback>{initials(review.username)}</AvatarFallback>
            </Avatar>
            <div className="min-w-0 flex-1 space-y-2">
              <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                <Link
                  href={`/users/${encodeURIComponent(review.username)}`}
                  className="font-medium hover:text-primary"
                >
                  @{review.username}
                </Link>
                {showCube ? (
                  <>
                    <span className="text-muted-foreground">on</span>
                    <Link
                      href={`/cubes/${review.cubeId}`}
                      className="font-medium hover:text-primary"
                    >
                      {review.cubeName}
                    </Link>
                    <span className="text-xs text-muted-foreground">
                      {review.cubeType}
                    </span>
                  </>
                ) : null}
                <span className="text-xs text-muted-foreground">
                  {new Date(review.createdAt).toLocaleDateString()}
                </span>
              </div>
              {review.metrics ? (
                <p className="flex flex-wrap gap-x-3 gap-y-1 text-xs text-muted-foreground">
                  {METRIC_KEYS.map((key) => (
                    <span key={key}>
                      {METRIC_LABELS[key]}{" "}
                      <span className="tabular-nums text-foreground">
                        {formatMetric(review.metrics?.[key], 0)}
                      </span>
                    </span>
                  ))}
                </p>
              ) : null}
              <p className="whitespace-pre-wrap text-sm leading-relaxed">
                {review.writtenContent}
              </p>
              {review.youtubeUrl ? (
                <a
                  href={review.youtubeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="inline-block text-sm text-primary hover:underline"
                >
                  Watch on YouTube
                </a>
              ) : null}
            </div>
          </div>
        </li>
      ))}
    </ul>
  )
}
