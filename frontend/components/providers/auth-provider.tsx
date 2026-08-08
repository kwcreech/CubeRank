"use client"

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react"
import type { Session } from "@supabase/supabase-js"

import { getMe } from "@/lib/api/client"
import { createClient } from "@/lib/supabase/client"
import type { MeResponse } from "@/lib/types/api"

type AuthContextValue = {
  session: Session | null
  user: MeResponse | null
  loading: boolean
  refreshUser: () => Promise<void>
  signOut: () => Promise<void>
}

const AuthContext = createContext<AuthContextValue | null>(null)

export function AuthProvider({ children }: { children: ReactNode }) {
  const supabase = useMemo(() => createClient(), [])
  const [session, setSession] = useState<Session | null>(null)
  const [user, setUser] = useState<MeResponse | null>(null)
  const [loading, setLoading] = useState(true)

  const loadUser = useCallback(
    async (activeSession: Session | null) => {
      if (!activeSession?.access_token) {
        setUser(null)
        return
      }

      try {
        const me = await getMe(activeSession.access_token)
        setUser(me)
      } catch {
        setUser(null)
      }
    },
    []
  )

  const refreshUser = useCallback(async () => {
    const {
      data: { session: currentSession },
    } = await supabase.auth.getSession()
    setSession(currentSession)
    await loadUser(currentSession)
  }, [loadUser, supabase.auth])

  useEffect(() => {
    let mounted = true

    async function init() {
      const {
        data: { session: initialSession },
      } = await supabase.auth.getSession()

      if (!mounted) return

      setSession(initialSession)
      await loadUser(initialSession)
      setLoading(false)
    }

    void init()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      void loadUser(nextSession)
      setLoading(false)
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
  }, [supabase.auth])

  const value = useMemo(
    () => ({
      session,
      user,
      loading,
      refreshUser,
      signOut,
    }),
    [session, user, loading, refreshUser, signOut]
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
