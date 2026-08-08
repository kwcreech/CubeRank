"use client"

import Link from "next/link"
import { FormEvent, useState } from "react"
import { toast } from "sonner"

import { Button, buttonVariants } from "@/components/ui/button"
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

export function ForgotPasswordForm() {
  const supabase = createClient()
  const [submitting, setSubmitting] = useState(false)
  const [sent, setSent] = useState(false)

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()

    // Default Supabase recovery emails (no custom SMTP/template) append ?code=
    // to redirectTo. /auth/confirm exchanges the PKCE code, then sends the
    // user to /auth/update-password.
    const redirectTo = `${window.location.origin}/auth/confirm`

    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo,
    })

    setSubmitting(false)

    if (error) {
      toast.error(error.message)
      return
    }

    setSent(true)
    toast.success("If that email is registered, a reset link is on the way.")
  }

  return (
    <div className="mx-auto w-full max-w-md px-4 py-10">
      <Card>
        <CardHeader>
          <CardTitle>Forgot password</CardTitle>
          <CardDescription>
            Enter your email and we&apos;ll send a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {sent ? (
            <div className="space-y-4 text-sm text-muted-foreground">
              <p>
                Check your inbox for a reset link. You can close this page once
                you&apos;ve opened it.
              </p>
              <Link
                href="/auth?tab=login"
                className={buttonVariants({
                  variant: "outline",
                  className: "w-full",
                })}
              >
                Back to log in
              </Link>
            </div>
          ) : (
            <form className="space-y-4" onSubmit={handleSubmit}>
              <div className="space-y-2">
                <Label htmlFor="forgot-email">Email</Label>
                <Input
                  id="forgot-email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                />
              </div>
              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? "Sending…" : "Send reset link"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                <Link
                  href="/auth?tab=login"
                  className="text-primary hover:underline"
                >
                  Back to log in
                </Link>
              </p>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
