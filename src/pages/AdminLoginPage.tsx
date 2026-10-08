import { useState } from 'react'
import { KeyRound, Mail, ShieldCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { Navigate } from 'react-router-dom'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function AdminLoginPage() {
  const { isAdmin, isLoading } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [notice, setNotice] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  if (isLoading) return <PageSpinner label="Checking administrator session…" />
  if (isAdmin) return <Navigate to="/admin/dashboard" replace />

  const signIn = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError('Supabase is not configured. Add the browser environment variables before signing in.')
      return
    }
    setSubmitting(true)
    const { error: signInError } = await supabase.auth.signInWithPassword({ email: email.trim(), password })
    setSubmitting(false)
    if (signInError) setError('We could not sign you in. Check your credentials and try again.')
  }

  const requestReset = async () => {
    setError(null)
    setNotice(null)
    if (!supabase) {
      setError('Supabase is not configured.')
      return
    }
    if (!email.trim()) {
      setError('Enter your administrator email address first.')
      return
    }
    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email.trim(), { redirectTo: `${window.location.origin}/admin/login` })
    if (resetError) setError('A reset link could not be requested. Please try again later.')
    else setNotice('If this email belongs to an administrator account, a reset link has been sent.')
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="bg-slate-950 px-6 py-8 text-white"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-500 text-slate-950"><ShieldCheck className="size-6" aria-hidden="true" /></span><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-300">Amballur Grama Panchayat</p><h1 className="mt-2 text-2xl font-black tracking-tight">Administrator access</h1><p className="mt-2 text-sm leading-6 text-slate-300">One authorized administrator manages protected petition records.</p></div>
        <form onSubmit={signIn} className="space-y-5 p-6" noValidate>
          <div><label htmlFor="email" className="text-sm font-extrabold text-slate-800">Email address</label><div className="relative mt-2"><Mail className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-base outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" required /></div></div>
          <div><label htmlFor="password" className="text-sm font-extrabold text-slate-800">Password</label><div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="password" type="password" autoComplete="current-password" value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-base outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" required /></div></div>
          {error && <InlineError>{error}</InlineError>}
          {notice && <p role="status" className="rounded-xl bg-emerald-50 px-3 py-3 text-sm font-medium leading-6 text-emerald-900">{notice}</p>}
          <Button type="submit" className="w-full" loading={submitting}>Sign in securely</Button>
          <button type="button" onClick={() => void requestReset()} className="mx-auto block text-sm font-bold text-emerald-800 hover:text-emerald-950">Forgot password?</button>
        </form>
      </Card>
    </main>
  )
}
