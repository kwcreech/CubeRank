import type { ReactNode } from "react"

export function PageShell({
  title,
  description,
  children,
}: {
  title?: string
  description?: string
  children?: ReactNode
}) {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      {title || description ? (
        <div className="mb-8 space-y-2">
          {title ? (
            <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>
          ) : null}
          {description ? (
            <p className="max-w-2xl text-muted-foreground">{description}</p>
          ) : null}
        </div>
      ) : null}
      {children}
    </div>
  )
}
