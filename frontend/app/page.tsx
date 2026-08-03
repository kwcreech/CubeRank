import { Button } from "@/components/ui/button"

export default function Page() {
  return (
    <div className="flex min-h-svh p-6">
      <div className="flex max-w-md min-w-0 flex-col gap-4 text-sm leading-loose">
        <div>
          <h1 className="font-medium">CubeRank</h1>
          <p className="text-muted-foreground">
            Frontend scaffold ready — Next.js, shadcn (Base UI), Motion,
            Recharts, and Supabase SSR.
          </p>
          <Button className="mt-2">Button</Button>
        </div>
        <div className="font-mono text-xs text-muted-foreground">
          Press <kbd className="rounded border px-1">d</kbd> to toggle dark mode
        </div>
      </div>
    </div>
  )
}
