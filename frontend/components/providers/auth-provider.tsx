"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"

import { getMe } from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"
import { ApiError, type MeResponse } from "@/lib/types/api"
import { toast } from "sonner"

type AuthContextValue = {
  session: Session | null
  user: MeResponse | null
  loading: boolean
  profileError: string | null
  refreshUser: () => Promise<MeResponse | null>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

function profileErrorMessage(err: unknown) {
  if (err instanceof ApiError) {
    if (err.status === 401 || err.status === 403) {
      return "Signed in, but the API rejected your session. Check that the Railway JWT issuer and JWKS URL match this Supabase project."
    }
    return err.message
  }
  return "Could not load your profile from the API."
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<MeResponse | null>(null)
  const [profileError, setProfileError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const lastProfileToast = useRef<string | null>(null)

  const loadUser = useCallback(async (activeSession: Session | null) => {
    if (!activeSession?.access_token) {
      setUser(null)
      setProfileError(null)
      lastProfileToast.current = null
      return null
    }

    try {
      const me = await getMe(activeSession.access_token)
      setUser(me)
      setProfileError(null)
      lastProfileToast.current = null
      return me
    } catch (err) {
      const message = profileErrorMessage(err)
      setUser(null)
      setProfileError(message)
      if (lastProfileToast.current !== message) {
        lastProfileToast.current = message
        toast.error(message)
      }
      return null
    }
  }, [])

  const refreshUser = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    setSession(currentSession)
    return loadUser(currentSession)
  }, [loadUser, supabase.auth])

  useEffect(() => {
    let mounted = true

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      if (!mounted) return
      setSession(nextSession)
      void loadUser(nextSession).finally(() => {
        if (mounted) setLoading(false)
      })
    })

    return () => {
      mounted = false
      subscription.unsubscribe()
    }
  }, [loadUser, supabase.auth])

  const signOut = useCallback(async () => {
    await supabase.auth.signOut()
    setSession(null)
    setUser(null)
    setProfileError(null)
  }, [supabase.auth])

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      profileError,
      refreshUser,
      signOut,
    }),
    [session, user, loading, profileError, refreshUser, signOut]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error("useAuth must be used within AuthProvider")
  }
  return context
}
