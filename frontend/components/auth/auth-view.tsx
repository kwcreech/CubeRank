"use client"

import Link from "next/link"
import { useRouter, useSearchParams } from "next/navigation"
import { FormEvent, useEffect, useState } from "react"
import { toast } from "sonner"

import { LegalDocumentLink } from "@/components/legal/legal-document-link"
import { useAuth } from "@/components/providers/auth-provider"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { updateMe } from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"
import { ApiError } from "@/lib/types/api"

const USERNAME_PATTERN = /^[a-zA-Z0-9_]{3,50}$/

export function AuthView() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, session, loading, refreshUser, signOut } = useAuth()
  const supabase = createClient()

  const initialTab = searchParams.get("tab") === "signup" ? "signup" : "login"
  const nextPath = searchParams.get("next") ?? "/home"

  const [tab, setTab] = useState(initialTab)
  const [submitting, setSubmitting] = useState(false)
  const [agreedToLegal, setAgreedToLegal] = useState(false)

  // Only leave /auth once the Spring profile loaded. A Supabase JWT alone used
  // to bounce production users to /home while the header still showed Log in.
  useEffect(() => {
    if (!loading && user) {
      router.replace(nextPath)
    }
  }, [loading, user, router, nextPath])

  async function handleLogin(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")

    const { error } = await supabase.auth.signInWithPassword({ email, password })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    const me = await refreshUser()
    setSubmitting(false)
    if (!me) {
      return
    }

    router.replace(nextPath)
    router.refresh()
  }

  async function handleSignup(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    setSubmitting(true)

    const form = new FormData(event.currentTarget)
    const email = String(form.get("email") ?? "").trim()
    const password = String(form.get("password") ?? "")
    const confirmPassword = String(form.get("confirmPassword") ?? "")
    const username = String(form.get("username") ?? "").trim()

    if (!agreedToLegal) {
      toast.error(
        "Please agree to the Terms of Service and Privacy Policy, and confirm you are at least 13 years old."
      )
      setSubmitting(false)
      return
    }

    if (!USERNAME_PATTERN.test(username)) {
      toast.error(
        "Username must be 3–50 characters and use only letters, numbers, and underscores."
      )
      setSubmitting(false)
      return
    }

    if (password !== confirmPassword) {
      toast.error("Passwords do not match.")
      setSubmitting(false)
      return
    }

    const { data, error } = await supabase.auth.signUp({ email, password })

    if (error) {
      toast.error(error.message)
      setSubmitting(false)
      return
    }

    const accessToken = data.session?.access_token
    if (!accessToken) {
      toast.success("Check your email to confirm your account, then log in.")
      setTab("login")
      setSubmitting(false)
      return
    }

    try {
      await updateMe(accessToken, { username })
      const me = await refreshUser()
      if (!me) {
        return
      }
      toast.success("Account created")
      router.replace(nextPath)
      router.refresh()
    } catch (err) {
      const message =
        err instanceof ApiError ? err.message : "Could not save username"
      toast.error(message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading || user) {
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
          <CardTitle>Welcome to CubeRank</CardTitle>
          <CardDescription>
            Sign up to review cubes or log in to your account.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {session && !user ? (
            <p className="mb-4 text-sm text-muted-foreground">
              Supabase still has a session, but the API did not accept it.{" "}
              <button
                type="button"
                className="font-medium text-primary hover:underline"
                onClick={() => void signOut()}
              >
                Sign out and try again
              </button>
            </p>
          ) : null}
          <Tabs value={tab} onValueChange={setTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="signup">Sign up</TabsTrigger>
              <TabsTrigger value="login">Log in</TabsTrigger>
            </TabsList>

            <TabsContent value="signup" className="mt-4">
              <form className="space-y-4" onSubmit={handleSignup}>
                <div className="space-y-2">
                  <Label htmlFor="signup-username">Username</Label>
                  <Input
                    id="signup-username"
                    name="username"
                    autoComplete="username"
                    required
                    minLength={3}
                    maxLength={50}
                    pattern="[a-zA-Z0-9_]{3,50}"
                    placeholder="cuberank_fan"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-email">Email</Label>
                  <Input
                    id="signup-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-password">Password</Label>
                  <Input
                    id="signup-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="signup-confirm-password">Confirm password</Label>
                  <Input
                    id="signup-confirm-password"
                    name="confirmPassword"
                    type="password"
                    autoComplete="new-password"
                    required
                    minLength={6}
                  />
                </div>
                <div className="flex items-start gap-2">
                  <Checkbox
                    id="signup-agree-legal"
                    checked={agreedToLegal}
                    onCheckedChange={(checked) =>
                      setAgreedToLegal(checked === true)
                    }
                    className="mt-0.5"
                    aria-labelledby="signup-agree-legal-label"
                    aria-required="true"
                  />
                  <p
                    id="signup-agree-legal-label"
                    className="text-sm leading-snug text-muted-foreground"
                  >
                    By creating an account, you agree to our{" "}
                    <LegalDocumentLink document="terms">
                      Terms of Service
                    </LegalDocumentLink>{" "}
                    and{" "}
                    <LegalDocumentLink document="privacy">
                      Privacy Policy
                    </LegalDocumentLink>
                    , and confirm you are at least 13 years old.
                  </p>
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Creating account…" : "Create account"}
                </Button>
              </form>
            </TabsContent>

            <TabsContent value="login" className="mt-4">
              <form className="space-y-4" onSubmit={handleLogin}>
                <div className="space-y-2">
                  <Label htmlFor="login-email">Email</Label>
                  <Input
                    id="login-email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between gap-2">
                    <Label htmlFor="login-password">Password</Label>
                    <Link
                      href="/auth/forgot-password"
                      className="text-xs font-medium text-primary hover:underline"
                    >
                      Forgot password?
                    </Link>
                  </div>
                  <Input
                    id="login-password"
                    name="password"
                    type="password"
                    autoComplete="current-password"
                    required
                  />
                </div>
                <Button type="submit" className="w-full" disabled={submitting}>
                  {submitting ? "Signing in…" : "Log in"}
                </Button>
              </form>
            </TabsContent>
          </Tabs>

          <p className="mt-6 text-center text-sm text-muted-foreground">
            <Link href="/" className="text-primary hover:underline">
              Back
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
