import { useQuery } from '@tanstack/react-query'
import { AlertTriangle, Building2, CalendarDays, ClipboardCheck, FileSignature, MapPinned, Users } from 'lucide-react'
import { AdminShell } from '../components/admin/AdminShell'
import { Card, InlineError, PageSpinner } from '../components/ui'
import { getDashboardMetrics } from '../services/admin-service'

const metricCards = [
  { key: 'validSignatures', label: 'Valid signatures', icon: FileSignature, color: 'text-emerald-700 bg-emerald-50' },
  { key: 'householdsRepresented', label: 'Households represented', icon: Building2, color: 'text-blue-700 bg-blue-50' },
  { key: 'wardsCovered', label: 'Wards covered', icon: MapPinned, color: 'text-violet-700 bg-violet-50' },
  { key: 'recentSubmissions', label: 'Recent submissions', icon: CalendarDays, color: 'text-amber-700 bg-amber-50' },
] as const

function BarChart({ title, values, labelKey }: { title: string; values: Array<{ ward?: string; date?: string; count: number }>; labelKey: 'ward' | 'date' }) {
  const max = Math.max(1, ...values.map((value) => value.count))
  return (
    <Card className="p-5 sm:p-6"><h2 className="text-base font-extrabold text-slate-950">{title}</h2>{values.length === 0 ? <p className="py-12 text-center text-sm font-medium text-slate-500">No submitted records yet.</p> : <div className="mt-6 flex h-52 items-end gap-3" role="img" aria-label={title}>{values.map((value) => <div key={value[labelKey]} className="flex h-full min-w-0 flex-1 flex-col justify-end text-center"><span className="mb-2 text-xs font-extrabold text-slate-600">{value.count}</span><div className="min-h-1 rounded-t-lg bg-emerald-600 transition-all" style={{ height: `${Math.max(5, (value.count / max) * 100)}%` }} /><span className="mt-2 truncate text-[11px] font-bold text-slate-500" title={value[labelKey]}>{value[labelKey]}</span></div>)}</div>}</Card>
  )
}

export function AdminDashboardPage() {
  const { data, isLoading, error } = useQuery({ queryKey: ['admin-dashboard-metrics'], queryFn: getDashboardMetrics })
  return <AdminShell>{isLoading ? <PageSpinner label="Loading live petition metrics…" /> : error || !data ? <InlineError>Dashboard metrics could not be loaded. Confirm that Supabase is configured and that your administrator role is active.</InlineError> : <div>
    <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between"><div><p className="text-sm font-bold text-emerald-800">Amballur Grama Panchayat</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Petition dashboard</h1><p className="mt-2 text-sm leading-6 text-slate-600">Live figures from authorized records only.</p></div><div className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-600"><ClipboardCheck className="size-4 text-emerald-700" aria-hidden="true" /> Review queue: {data.requiringReview}</div></div>
    <div className="mt-7 grid gap-4 sm:grid-cols-2 xl:grid-cols-4">{metricCards.map(({ key, label, icon: Icon, color }) => <Card key={key} className="p-5"><div className="flex items-start justify-between gap-3"><div><p className="text-sm font-bold text-slate-600">{label}</p><p className="mt-3 text-3xl font-black tracking-tight text-slate-950">{data[key]}</p></div><span className={`grid size-10 place-items-center rounded-xl ${color}`}><Icon className="size-5" aria-hidden="true" /></span></div></Card>)}</div>
    <div className="mt-6 grid gap-5 xl:grid-cols-2"><BarChart title="Signatures by ward" values={data.byWard} labelKey="ward" /><BarChart title="Daily collection trend" values={data.byDay} labelKey="date" /></div>
    {data.requiringReview > 0 && <div className="mt-6 flex gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm leading-6 text-amber-950"><AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden="true" /><span>{data.requiringReview} submission{data.requiringReview === 1 ? '' : 's'} require review. Review flags do not automatically exclude a resident’s support.</span></div>}
    <div className="mt-6 flex items-center gap-3 text-sm font-medium text-slate-500"><Users className="size-4" aria-hidden="true" /> Counts exclude records marked excluded and are not estimates.</div>
  </div>}</AdminShell>
}
