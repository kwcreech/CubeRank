"use client"

import Link from "next/link"
import { useRouter } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { createClient } from "@/lib/supabase/client"

export function UpdatePasswordForm() {
  const router = useRouter()
  const { session, loading } = useAuth()
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)

  useEffect(() => {
    if (!loading && !session) {
      toast.error("Reset link is invalid or expired. Request a new one.")
      router.replace("/auth/forgot-password")
    }
  }, [loading, session, router])

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const password = String(form.get("password") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      setSubmitting(false)
      return
    }

    if (password.length < 6) {
      toast.error("Password must be at least 6 characters.")
      setSubmitting(false)
      return
    }

    const { error } = await supabase.auth.updateUser({ password })

    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    toast.success("Password updated")
    router.replace("/home")
    router.refresh()
  }

  if (loading || !session) {
    return (
      <div className="mx-auto flex min-h-[50vh] max-w-md items-center justify-center px-4">
        <p className="text-sm text-muted-foreground">Loading…</p>
      </div>
    )
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Set a new password</CardTitle>
          <CardDescription>
            Choose a new password for your CubeRank account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-4" onSubmit={handleSubmit}>
            <div className="space-y-2">
              <Label htmlFor="new-password">New password</Label>
              <Input
                id="new-password"
                name="password"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-new-password">Confirm password</Label>
              <Input
                id="confirm-new-password"
                name="confirmPassword"
                type="password"
                autoComplete="new-password"
                required
                minLength={6}
              />
            </div>
            <Button type="submit" className="w-full" disabled={submitting}>
              {submitting ? "Updating…" : "Update password"}
            </Button>
            <p className="text-center text-sm text-muted-foreground">
              <Link href="/auth?tab=login" className="text-primary hover:underline">
                Back to log in
              </Link>
            </p>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
