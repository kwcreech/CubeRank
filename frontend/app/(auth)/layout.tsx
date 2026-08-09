import { HeroBackdrop } from "@/components/landing/hero-backdrop"

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="relative min-h-svh overflow-hidden bg-background">
      <HeroBackdrop />
      <div className="relative z-10 flex min-h-svh items-center justify-center">
        {children}
      </div>
    </div>
  )
}
