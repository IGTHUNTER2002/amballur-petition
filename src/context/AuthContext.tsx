import { useEffect, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import type { Session } from '@supabase/supabase-js'
import { getAdminProfile } from '../services/admin-service'
import { supabase } from '../lib/supabase'
import type { AdminProfile } from '../types/petition'
import { AuthContext, type AuthContextValue } from './auth-context'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null)
  const [profile, setProfile] = useState<AdminProfile | null>(null)
  const [isLoading, setIsLoading] = useState(() => Boolean(supabase))

  useEffect(() => {
    if (!supabase) {
      return undefined
    }
    let active = true
    const hydrate = async (nextSession: Session | null) => {
      setSession(nextSession)
      if (!nextSession?.user) {
        if (active) {
          setProfile(null)
          setIsLoading(false)
        }
        return
      }
      try {
        const nextProfile = await getAdminProfile(nextSession.user)
        if (active) setProfile(nextProfile)
      } catch {
        if (active) setProfile(null)
      } finally {
        if (active) setIsLoading(false)
      }
    }
    void supabase.auth.getSession().then(({ data }) => hydrate(data.session))
    const { data: subscription } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      void hydrate(nextSession)
    })
    return () => {
      active = false
      subscription.subscription.unsubscribe()
    }
  }, [])

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      profile,
      isLoading,
      isAdmin: Boolean(session && profile),
      signOut: async () => {
        if (supabase) await supabase.auth.signOut()
      },
    }),
    [isLoading, profile, session],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
