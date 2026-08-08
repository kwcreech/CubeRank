export default function AuthLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-svh bg-gradient-to-b from-background via-background to-accent/20">
      {children}
    </div>
  )
}
