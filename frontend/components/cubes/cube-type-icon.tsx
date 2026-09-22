import { BoxIcon } from "lucide-react"

import { cubeTypeIcon, cubeTypeTintClass } from "@/lib/cubes/type-icon"
import { cn } from "@/lib/utils"

const TILE_SIZE = {
  xs: "size-6 rounded-md text-sm",
  sm: "size-8 rounded-lg text-lg",
  md: "size-12 rounded-lg text-2xl",
  lg: "size-16 rounded-xl text-4xl",
} as const

const GLYPH_SIZE = {
  xs: "text-sm",
  sm: "text-lg",
  md: "text-2xl",
  lg: "text-4xl",
  hero: "text-8xl leading-none",
} as const

const BOX_SIZE = {
  xs: "size-3.5",
  sm: "size-4",
  md: "size-5",
  lg: "size-7",
  hero: "size-24",
} as const

export function CubeTypeIcon({
  type,
  size = "md",
  tile = true,
  className,
}: {
  type: string
  size?: keyof typeof GLYPH_SIZE
  tile?: boolean
  className?: string
}) {
  const icon = cubeTypeIcon(type)?.icon

  if (!tile || size === "hero") {
    if (!icon) {
      return (
        <BoxIcon
          aria-hidden
          className={cn(BOX_SIZE[size], className)}
        />
      )
    }
    return (
      <span
        aria-hidden
        className={cn(
          "cubing-icon inline-block leading-none",
          icon,
          GLYPH_SIZE[size],
          className
        )}
      />
    )
  }

  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center justify-center",
        TILE_SIZE[size],
        cubeTypeTintClass(type),
        className
      )}
    >
      {icon ? (
        <span className={cn("cubing-icon leading-none", icon)} />
      ) : (
        <BoxIcon className={BOX_SIZE[size]} />
      )}
    </span>
  )
}
