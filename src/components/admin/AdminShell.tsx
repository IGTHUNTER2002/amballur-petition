import { BarChart3, FileDown, FileSignature, LogOut, Settings, ShieldCheck } from 'lucide-react'
import type { ReactNode } from 'react'
import { NavLink, Navigate } from 'react-router-dom'
import { useAuth } from '../../hooks/useAuth'
import { AppMark, Button, PageSpinner } from '../ui'

const navigation = [
  { to: '/admin/dashboard', label: 'Dashboard', icon: BarChart3 },
  { to: '/admin/signatures', label: 'Signatures', icon: FileSignature },
  { to: '/admin/settings', label: 'Petition settings', icon: Settings },
  { to: '/admin/exports', label: 'PDF export', icon: FileDown },
]

export function AdminShell({ children }: { children: ReactNode }) {
  const { profile, isAdmin, isLoading, signOut } = useAuth()
  if (isLoading) return <PageSpinner label="Verifying administrator access…" />
  if (!isAdmin) return <Navigate to="/admin/login" replace />

  return (
    <div className="min-h-screen bg-slate-100">
      <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <AppMark />
          <div className="flex items-center gap-3">
            <span className="hidden text-right text-xs font-semibold text-slate-600 sm:block">
              <span className="block text-slate-900">{profile?.displayName}</span>
              Single administrator
            </span>
            <Button variant="quiet" onClick={() => void signOut()} className="min-h-10 px-3 text-xs">
              <LogOut className="size-4" aria-hidden="true" />
              <span className="hidden sm:inline">Sign out</span>
            </Button>
          </div>
        </div>
      </header>
      <div className="mx-auto grid max-w-7xl lg:grid-cols-[15rem_minmax(0,1fr)]">
        <aside className="border-b border-slate-200 bg-white px-3 py-3 lg:min-h-[calc(100vh-65px)] lg:border-b-0 lg:border-r lg:px-4 lg:py-7">
          <nav className="flex gap-1 overflow-x-auto lg:flex-col" aria-label="Admin navigation">
            {navigation.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                className={({ isActive }) => `inline-flex shrink-0 items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-bold transition ${isActive ? 'bg-emerald-50 text-emerald-800' : 'text-slate-600 hover:bg-slate-50 hover:text-slate-950'}`}
              >
                <Icon className="size-4" aria-hidden="true" />
                {label}
              </NavLink>
            ))}
          </nav>
          <div className="mt-7 hidden rounded-2xl bg-slate-900 p-4 text-sm text-slate-100 lg:block">
            <ShieldCheck className="mb-2 size-5 text-emerald-400" aria-hidden="true" />
            <p className="font-bold">Protected records</p>
            <p className="mt-1 text-xs leading-5 text-slate-300">Resident data and signatures are only available to the authorized administrator.</p>
          </div>
        </aside>
        <main className="min-w-0 p-4 sm:p-6 lg:p-8">{children}</main>
      </div>
    </div>
  )
}
