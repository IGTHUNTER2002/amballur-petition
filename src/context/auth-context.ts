import { createContext } from 'react'
import type { Session } from '@supabase/supabase-js'
import type { AdminProfile } from '../types/petition'

export interface AuthContextValue {
  session: Session | null
  profile: AdminProfile | null
  isLoading: boolean
  isAdmin: boolean
  signOut: () => Promise<void>
  loginAsDemoAdmin?: () => void
}

export const AuthContext = createContext<AuthContextValue | null>(null)
