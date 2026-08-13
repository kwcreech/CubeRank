"use client"

import { useRouter } from "next/navigation"
import { useTheme } from "next-themes"
import { FormEvent, useEffect, useState, useSyncExternalStore } from "react"
import { toast } from "sonner"

import { useAuth } from "@/components/providers/auth-provider"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { updateMe } from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"
import { ApiError } from "@/lib/types/api"
import { isValidUsername } from "@/lib/username"

const AVATAR_BUCKET = "avatars"
const MAX_AVATAR_BYTES = 2 * 1024 * 1024

function initials(username: string) {
  return username.slice(0, 2).toUpperCase()
}

function extensionFor(file: File) {
  const fromName = file.name.split(".").pop()?.toLowerCase()
  if (fromName && /^[a-z0-9]+$/.test(fromName)) return fromName
  if (file.type === "image/png") return "png"
  if (file.type === "image/webp") return "webp"
  if (file.type === "image/gif") return "gif"
  return "jpg"
}

function subscribe() {
  return () => {}
}

export function SettingsForm() {
  const router = useRouter()
  const { session, user, loading, refreshUser } = useAuth()
  const { resolvedTheme, setTheme } = useTheme()
  const supabase = createClient()
  const mounted = useSyncExternalStore(subscribe, () => true, () => false)

  const [usernameDraft, setUsernameDraft] = useState<string | null>(null)
  const [savingUsername, setSavingUsername] = useState(false)
  const [uploadingAvatar, setUploadingAvatar] = useState(false)
  const [clearingAvatar, setClearingAvatar] = useState(false)

  const username = usernameDraft ?? user?.username ?? ""

  useEffect(() => {
    if (!loading && !session) {
      router.replace("/auth?tab=login&next=/settings")
    }
  }, [loading, session, router])

  async function handleUsernameSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault()
    if (!session?.access_token || !user) return

    const nextUsername = username.trim()
    if (!isValidUsername(nextUsername)) {
      toast.error(
        "Username must be 3–50 characters and use only letters, numbers, and underscores."
      )
      return
    }

    if (nextUsername === user.username) {
      toast.message("Username is unchanged.")
      return
    }

    setSavingUsername(true)
    try {
      await updateMe(session.access_token, { username: nextUsername })
      setUsernameDraft(null)
      await refreshUser()
      toast.success("Username updated.")
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to update username."
      )
    } finally {
      setSavingUsername(false)
    }
  }

  async function handleAvatarChange(
    event: React.ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0]
    event.target.value = ""
    if (!file || !session?.access_token || !user) return

    if (!file.type.startsWith("image/")) {
      toast.error("Choose an image file.")
      return
    }
    if (file.size > MAX_AVATAR_BYTES) {
      toast.error("Avatar must be 2MB or smaller.")
      return
    }

    setUploadingAvatar(true)
    try {
      const path = `${user.id}/${Date.now()}.${extensionFor(file)}`
      const { error: uploadError } = await supabase.storage
        .from(AVATAR_BUCKET)
        .upload(path, file, {
          cacheControl: "3600",
          upsert: true,
          contentType: file.type,
        })

      if (uploadError) {
        throw new Error(uploadError.message)
      }

      const {
        data: { publicUrl },
      } = supabase.storage.from(AVATAR_BUCKET).getPublicUrl(path)

      await updateMe(session.access_token, { avatarUrl: publicUrl })
      await refreshUser()
      toast.success("Avatar updated.")
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : "Failed to upload avatar."
      )
    } finally {
      setUploadingAvatar(false)
    }
  }

  async function handleClearAvatar() {
    if (!session?.access_token || !user?.avatarUrl) return

    setClearingAvatar(true)
    try {
      await updateMe(session.access_token, { avatarUrl: "" })
      await refreshUser()
      toast.success("Avatar cleared.")
      router.refresh()
    } catch (err) {
      toast.error(
        err instanceof ApiError ? err.message : "Failed to clear avatar."
      )
    } finally {
      setClearingAvatar(false)
    }
  }

  if (loading || !session || !user) {
    return (
      <p className="text-sm text-muted-foreground">Checking your session…</p>
    )
  }

  const darkMode = mounted && resolvedTheme === "dark"

  return (
    <div className="mx-auto max-w-xl space-y-10">
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Avatar</h2>
          <p className="text-sm text-muted-foreground">
            Upload a square image up to 2MB.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-4">
          <Avatar className="size-16 after:rounded-full data-[size=default]:size-16">
            {user.avatarUrl ? (
              <AvatarImage src={user.avatarUrl} alt={user.username} />
            ) : null}
            <AvatarFallback className="text-lg">
              {initials(user.username)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-wrap gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={uploadingAvatar}
              onClick={() =>
                document.getElementById("avatar-upload")?.click()
              }
            >
              {uploadingAvatar ? "Uploading…" : "Upload"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              disabled={!user.avatarUrl || clearingAvatar}
              onClick={handleClearAvatar}
            >
              {clearingAvatar ? "Clearing…" : "Clear"}
            </Button>
            <input
              id="avatar-upload"
              type="file"
              accept="image/png,image/jpeg,image/webp,image/gif"
              className="hidden"
              onChange={handleAvatarChange}
            />
          </div>
        </div>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Username</h2>
          <p className="text-sm text-muted-foreground">
            Letters, numbers, and underscores only.
          </p>
        </div>
        <form onSubmit={handleUsernameSubmit} className="flex flex-wrap items-center gap-2">
          <div className="min-w-[12rem] flex-1 space-y-2">
            <Label htmlFor="settings-username" className="sr-only">
              Username
            </Label>
            <Input
              id="settings-username"
              value={username}
              onChange={(event) => setUsernameDraft(event.target.value)}
              autoComplete="username"
              minLength={3}
              maxLength={50}
              required
            />
          </div>
          <Button type="submit" disabled={savingUsername}>
            {savingUsername ? "Saving…" : "Save"}
          </Button>
        </form>
      </section>

      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold tracking-tight">Theme</h2>
          <p className="text-sm text-muted-foreground">
            Stored on this device only.
          </p>
        </div>
        <div className="flex items-center justify-between gap-4 rounded-xl px-4 py-3 ring-1 ring-foreground/35 dark:ring-foreground/15">
          <div>
            <p className="text-sm font-medium">Dark mode</p>
            <p className="text-xs text-muted-foreground">
              {mounted
                ? darkMode
                  ? "Currently dark"
                  : "Currently light"
                : "Loading…"}
            </p>
          </div>
          <Switch
            checked={darkMode}
            disabled={!mounted}
            onCheckedChange={(checked) =>
              setTheme(checked ? "dark" : "light")
            }
            aria-label="Toggle dark mode"
          />
        </div>
      </section>

      <section className="space-y-2">
        <h2 className="text-lg font-semibold tracking-tight">Account</h2>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Email</dt>
            <dd className="truncate font-medium">{user.email}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Role</dt>
            <dd className="font-medium">{user.role}</dd>
          </div>
        </dl>
      </section>
    </div>
  )
}
