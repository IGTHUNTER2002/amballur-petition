import { CircleAlert, LoaderCircle, ShieldCheck } from 'lucide-react'
import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { mergeClasses } from '../lib/utils'

export function AppMark({ compact = false }: { compact?: boolean }) {
  return (
    <div className="flex items-center gap-3 text-slate-950">
      <span className="grid size-10 place-items-center rounded-2xl bg-emerald-700 text-white shadow-lg shadow-emerald-900/15" aria-hidden="true">
        <ShieldCheck size={21} strokeWidth={2.25} />
      </span>
      {!compact && (
        <span className="leading-none">
          <span className="block text-sm font-extrabold tracking-tight">Safer Streets</span>
          <span className="mt-1 block text-xs font-semibold text-emerald-700">Amballur Grama Panchayat</span>
        </span>
      )}
    </div>
  )
}

type ButtonVariant = 'primary' | 'secondary' | 'quiet' | 'danger'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
  loading?: boolean
  children: ReactNode
}

export function Button({ className, variant = 'primary', loading = false, children, disabled, ...props }: ButtonProps) {
  const variants: Record<ButtonVariant, string> = {
    primary: 'bg-emerald-700 text-white shadow-sm shadow-emerald-900/20 hover:bg-emerald-800 focus-visible:outline-emerald-700',
    secondary: 'bg-blue-700 text-white shadow-sm shadow-blue-900/20 hover:bg-blue-800 focus-visible:outline-blue-700',
    quiet: 'border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 focus-visible:outline-slate-500',
    danger: 'bg-rose-700 text-white hover:bg-rose-800 focus-visible:outline-rose-700',
  }
  return (
    <button
      {...props}
      disabled={disabled || loading}
      className={mergeClasses(
        'inline-flex min-h-11 items-center justify-center gap-2 rounded-xl px-4 text-sm font-bold transition disabled:cursor-not-allowed disabled:opacity-60 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2',
        variants[variant],
        className,
      )}
    >
      {loading && <LoaderCircle className="size-4 animate-spin" aria-hidden="true" />}
      {children}
    </button>
  )
}

export function Card({ className, children }: { className?: string; children: ReactNode }) {
  return <section className={mergeClasses('rounded-3xl border border-slate-200 bg-white shadow-sm shadow-slate-900/[0.035]', className)}>{children}</section>
}

export function InlineError({ children }: { children: ReactNode }) {
  return (
    <div role="alert" className="flex gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-3 text-sm font-medium leading-6 text-rose-800">
      <CircleAlert className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
      <span>{children}</span>
    </div>
  )
}

export function PageSpinner({ label = 'Loading…' }: { label?: string }) {
  return (
    <div className="grid min-h-[42vh] place-items-center text-center text-slate-600">
      <div>
        <LoaderCircle className="mx-auto mb-3 size-7 animate-spin text-emerald-700" aria-hidden="true" />
        <p className="text-sm font-semibold">{label}</p>
      </div>
    </div>
  )
}
