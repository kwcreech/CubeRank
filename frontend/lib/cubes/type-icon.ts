const TYPE_ICONS: Record<string, { icon: string; tint: string }> = {
  "2x2": { icon: "event-222", tint: "bg-chart-1/15 text-chart-1" },
  "3x3": { icon: "event-333", tint: "bg-chart-2/15 text-chart-2" },
  "4x4": { icon: "event-444", tint: "bg-chart-3/15 text-chart-3" },
  "5x5": { icon: "event-555", tint: "bg-chart-4/15 text-chart-4" },
  "6x6": { icon: "event-666", tint: "bg-chart-5/15 text-chart-5" },
  "7x7": { icon: "event-777", tint: "bg-chart-1/15 text-chart-1" },
  megaminx: { icon: "event-minx", tint: "bg-chart-2/15 text-chart-2" },
  pyraminx: { icon: "event-pyram", tint: "bg-chart-3/15 text-chart-3" },
  skewb: { icon: "event-skewb", tint: "bg-chart-4/15 text-chart-4" },
  "square-1": { icon: "event-sq1", tint: "bg-chart-5/15 text-chart-5" },
  clock: { icon: "event-clock", tint: "bg-chart-1/15 text-chart-1" },
  fto: { icon: "unofficial-fto", tint: "bg-chart-2/15 text-chart-2" },
}

const FALLBACK_TINT = "bg-muted text-muted-foreground"

export function cubeTypeIcon(type: string) {
  return TYPE_ICONS[type.trim().toLowerCase()] ?? null
}

export function cubeTypeTintClass(type: string) {
  return cubeTypeIcon(type)?.tint ?? FALLBACK_TINT
}
