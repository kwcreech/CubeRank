"use client"

import Link from "next/link"
import { usePathname, useRouter } from "next/navigation"

import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { buttonVariants } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { cn } from "@/lib/utils"

const navItems = [
  { href: "/home", label: "Home" },
  { href: "/cubes", label: "Cubes" },
  { href: "/review", label: "Review" },
  { href: "/compare", label: "Compare" },
  { href: "/leaderboards", label: "Leaderboards" },
] as const

function initials(username: string | null | undefined) {
  const value = username?.trim()
  if (!value) return "?"
  return value.slice(0, 2).toUpperCase()
}

export function SiteHeader() {
  const pathname = usePathname()
  const router = useRouter()
  const { user, loading, signOut } = useAuth()

  const items =
    user?.role === "ADMIN"
      ? [...navItems, { href: "/admin", label: "Admin" } as const]
      : navItems

  async function handleSignOut() {
    await signOut()
    router.push("/home")
    router.refresh()
  }

  return (
    <header className="sticky top-0 z-40 border-b border-border/80 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/80">
      <div className="mx-auto flex h-14 max-w-6xl items-center gap-6 px-4">
        <Link
          href="/home"
          className="font-display text-lg font-bold tracking-tight text-foreground"
        >
          CubeRank
        </Link>

        <nav className="hidden flex-1 items-center gap-1 sm:flex">
          {items.map(({ href, label }) => {
            const active =
              pathname === href ||
              (href !== "/home" && pathname.startsWith(`${href}/`))

            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "rounded-lg px-3 py-1.5 text-sm font-medium transition-colors",
                  active
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground"
                )}
              >
                {label}
              </Link>
            )
          })}
        </nav>

        <div className="ml-auto flex items-center gap-2">
          {loading ? (
            <div className="size-8 animate-pulse rounded-full bg-muted" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger
                className="rounded-full outline-none focus-visible:ring-3 focus-visible:ring-ring/50 data-popup-open:ring-3 data-popup-open:ring-ring/50"
                aria-label="Account menu"
              >
                <Avatar size="sm">
                  {user.avatarUrl ? (
                    <AvatarImage src={user.avatarUrl} alt={user.username} />
                  ) : null}
                  <AvatarFallback>{initials(user.username)}</AvatarFallback>
                </Avatar>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuGroup>
                  <DropdownMenuLabel>@{user.username}</DropdownMenuLabel>
                  <DropdownMenuItem
                    onClick={() =>
                      router.push(`/users/${encodeURIComponent(user.username)}`)
                    }
                  >
                    My profile
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => router.push("/settings")}>
                    Settings
                  </DropdownMenuItem>
                </DropdownMenuGroup>
                <DropdownMenuSeparator />
                <DropdownMenuGroup>
                  <DropdownMenuItem
                    variant="destructive"
                    onClick={handleSignOut}
                  >
                    Log out
                  </DropdownMenuItem>
                </DropdownMenuGroup>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <>
              <Link
                href="/auth?tab=login"
                className={buttonVariants({ variant: "ghost", size: "sm" })}
              >
                Log in
              </Link>
              <Link
                href="/auth?tab=signup"
                className={buttonVariants({ size: "sm" })}
              >
                Sign up
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  )
}
