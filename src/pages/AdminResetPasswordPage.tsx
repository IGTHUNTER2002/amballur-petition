import { useState } from 'react'
import type { FormEvent } from 'react'
import { KeyRound, ShieldCheck } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { useAuth } from '../hooks/useAuth'
import { supabase } from '../lib/supabase'

export function AdminResetPasswordPage() {
  const { session, isLoading } = useAuth()
  const navigate = useNavigate()
  const [password, setPassword] = useState('')
  const [confirmation, setConfirmation] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const client = supabase

  if (isLoading) return <PageSpinner label="Preparing password reset…" />
  if (!client) return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8"><Card className="w-full max-w-md p-6"><h1 className="text-2xl font-black text-slate-950">Password reset is unavailable</h1><p className="mt-2 text-sm leading-6 text-slate-600">Supabase is not configured for this site.</p></Card></main>
  if (!session) {
    return <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8"><Card className="w-full max-w-md p-6"><h1 className="text-2xl font-black text-slate-950">Password reset link required</h1><p className="mt-2 text-sm leading-6 text-slate-600">Open the password-reset link sent to your administrator email, then return here to choose a new password.</p><Link to="/admin/login" className="mt-5 inline-block text-sm font-bold text-emerald-800 hover:text-emerald-950">Return to administrator login</Link></Card></main>
  }

  const updatePassword = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setError(null)
    if (password.length < 12) {
      setError('Use at least 12 characters for the new password.')
      return
    }
    if (password !== confirmation) {
      setError('The password confirmation does not match.')
      return
    }
    setSubmitting(true)
    const { error: updateError } = await client.auth.updateUser({ password })
    setSubmitting(false)
    if (updateError) {
      setError('The password could not be updated. Request a new reset link and try again.')
      return
    }
    await client.auth.signOut()
    navigate('/admin/login', { replace: true })
  }

  return (
    <main className="grid min-h-screen place-items-center bg-slate-100 px-4 py-8">
      <Card className="w-full max-w-md overflow-hidden">
        <div className="bg-slate-950 px-6 py-8 text-white"><span className="grid size-11 place-items-center rounded-2xl bg-emerald-500 text-slate-950"><ShieldCheck className="size-6" aria-hidden="true" /></span><p className="mt-5 text-xs font-extrabold uppercase tracking-[0.13em] text-emerald-300">Amballur Grama Panchayat</p><h1 className="mt-2 text-2xl font-black tracking-tight">Choose a new password</h1><p className="mt-2 text-sm leading-6 text-slate-300">Set a new password for the administrator account.</p></div>
        <form onSubmit={updatePassword} className="space-y-5 p-6" noValidate>
          <div><label htmlFor="new-password" className="text-sm font-extrabold text-slate-800">New password</label><div className="relative mt-2"><KeyRound className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input id="new-password" type="password" autoComplete="new-password" minLength={12} value={password} onChange={(event) => setPassword(event.target.value)} className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-base outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" required /></div><p className="mt-1.5 text-xs text-slate-500">Use at least 12 characters.</p></div>
          <div><label htmlFor="confirm-password" className="text-sm font-extrabold text-slate-800">Confirm new password</label><input id="confirm-password" type="password" autoComplete="new-password" minLength={12} value={confirmation} onChange={(event) => setConfirmation(event.target.value)} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-base outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" required /></div>
          {error && <InlineError>{error}</InlineError>}
          <Button type="submit" className="w-full" loading={submitting}>Save new password</Button>
        </form>
      </Card>
    </main>
  )
}
