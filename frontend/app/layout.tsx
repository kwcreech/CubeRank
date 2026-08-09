import type { Metadata } from "next"
import { Open_Sans, Syne } from "next/font/google"

import "./globals.css"
import { AuthProvider } from "@/components/providers/auth-provider"
import { ThemeProvider } from "@/components/theme-provider"
import { Toaster } from "@/components/ui/sonner"
import { cn } from "@/lib/utils"

const fontSans = Open_Sans({
  subsets: ["latin"],
  variable: "--font-sans",
})

const fontDisplay = Syne({
  subsets: ["latin"],
  variable: "--font-display",
})

export const metadata: Metadata = {
  title: "CubeRank",
  description: "Speedcube reviews, radars, and leaderboards",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="en"
      suppressHydrationWarning
      className={cn(fontSans.variable, fontDisplay.variable, "font-sans antialiased")}
    >
      <body>
        <ThemeProvider>
          <AuthProvider>
            {children}
            <Toaster richColors closeButton />
          </AuthProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
