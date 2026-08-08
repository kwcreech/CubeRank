import { Syne } from "next/font/google"

import { cn } from "@/lib/utils"

const fontDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-display",
})

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <div className={cn(fontDisplay.variable)}>{children}</div>
}
