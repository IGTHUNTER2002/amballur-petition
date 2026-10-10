import { useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { ExternalLink, Eye, Search, ShieldAlert, Trash2 } from 'lucide-react'
import { AdminShell } from '../components/admin/AdminShell'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { createSignatureUrl, deleteSubmission, getAdminSubmissions, updateSubmissionReview } from '../services/admin-service'
import { formatDateTime } from '../lib/utils'
import { useAdminPetition } from '../hooks/useAdminPetition'
import type { AdminSubmission } from '../types/petition'

function statusStyle(status: AdminSubmission['reviewStatus']) {
  if (status === 'valid') return 'bg-emerald-50 text-emerald-800'
  if (status === 'excluded') return 'bg-rose-50 text-rose-800'
  return 'bg-amber-50 text-amber-800'
}

export function AdminSignaturesPage() {
  const [search, setSearch] = useState('')
  const [wardId, setWardId] = useState('')
  const [page, setPage] = useState(1)
  const [error, setError] = useState<string | null>(null)
  const [deletingId, setDeletingId] = useState<string | null>(null)
  const queryClient = useQueryClient()
  const { data: petition } = useAdminPetition()
  const { data, isLoading, error: queryError } = useQuery({ queryKey: ['admin-submissions', search, wardId, page], queryFn: () => getAdminSubmissions(search, wardId, page) })
  const pageSize = 20
  const openSignature = async (submissionId: string) => {
    setError(null)
    try { window.location.assign(await createSignatureUrl(submissionId)) } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'The signature preview could not be opened.') }
  }
  const review = async (id: string, status: AdminSubmission['reviewStatus']) => {
    setError(null)
    const reason = status === 'excluded' ? window.prompt('Record the exclusion reason for the audit log:') : undefined
    if (status === 'excluded' && !reason?.trim()) return
    try { await updateSubmissionReview(id, status, reason ?? undefined); await queryClient.invalidateQueries({ queryKey: ['admin-submissions'] }); await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] }) } catch (nextError) { setError(nextError instanceof Error ? nextError.message : 'The status could not be updated.') }
  }
  const removeSubmission = async (submission: AdminSubmission) => {
    if (!window.confirm(`Permanently delete signature ${submission.reference} and its stored image? This cannot be undone.`)) return
    setError(null); setDeletingId(submission.id)
    try {
      await deleteSubmission(submission.id)
      await queryClient.invalidateQueries({ queryKey: ['admin-submissions'] })
      await queryClient.invalidateQueries({ queryKey: ['admin-dashboard-metrics'] })
    } catch (nextError) {
      setError(nextError instanceof Error ? nextError.message : 'The signature record could not be deleted.')
    } finally {
      setDeletingId(null)
    }
  }
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / pageSize))
  return <AdminShell><div>
    <div><p className="text-sm font-bold text-emerald-800">Protected records</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Signature management</h1><p className="mt-2 text-sm leading-6 text-slate-600">Search, review, and exclude only with a documented reason. Potential duplicates remain records until you decide otherwise.</p></div>
    <Card className="mt-7 p-4 sm:p-5"><div className="grid gap-3 md:grid-cols-[minmax(0,1fr)_14rem]"><label className="relative"><span className="sr-only">Search signatures</span><Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-slate-500" aria-hidden="true" /><input value={search} onChange={(event) => { setSearch(event.target.value); setPage(1) }} placeholder="Search resident, house, or reference" className="w-full rounded-xl border border-slate-300 py-3 pl-10 pr-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></label><select value={wardId} onChange={(event) => { setWardId(event.target.value); setPage(1) }} className="rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm font-medium outline-none focus:border-emerald-600"> <option value="">All wards</option>{petition?.wards.map((ward) => <option key={ward.id} value={ward.id}>{ward.number} — {ward.name}</option>)}</select></div></Card>
    {error && <div className="mt-4"><InlineError>{error}</InlineError></div>}
    {isLoading ? <PageSpinner label="Loading protected signatures…" /> : queryError || !data ? <div className="mt-5"><InlineError>Signature records could not be loaded.</InlineError></div> : <Card className="mt-5 overflow-hidden"><div className="overflow-x-auto"><table className="min-w-[870px] w-full text-left"><thead className="bg-slate-50 text-xs font-extrabold uppercase tracking-wide text-slate-500"><tr><th className="px-5 py-4">Reference</th><th className="px-5 py-4">Resident</th><th className="px-5 py-4">Ward</th><th className="px-5 py-4">Submitted</th><th className="px-5 py-4">Review</th><th className="px-5 py-4"><span className="sr-only">Actions</span></th></tr></thead><tbody className="divide-y divide-slate-100">{data.items.length === 0 ? <tr><td colSpan={6} className="px-5 py-12 text-center text-sm font-medium text-slate-500">No matching records.</td></tr> : data.items.map((submission) => <tr key={submission.id} className="text-sm text-slate-700"><td className="px-5 py-4 font-bold text-slate-950">{submission.reference}</td><td className="px-5 py-4"><span className="block font-semibold text-slate-900">{submission.residentName}</span><span className="block text-xs text-slate-500">{submission.houseName}</span>{submission.duplicateFlags.length > 0 && <span className="mt-1 inline-flex items-center gap-1 text-xs font-bold text-amber-700"><ShieldAlert className="size-3" aria-hidden="true" />Needs review</span>}</td><td className="px-5 py-4">{submission.wardName}</td><td className="px-5 py-4 text-xs font-medium text-slate-600">{formatDateTime(submission.submittedAt)}</td><td className="px-5 py-4"><select aria-label={`Change review status for ${submission.reference}`} value={submission.reviewStatus} onChange={(event) => void review(submission.id, event.target.value as AdminSubmission['reviewStatus'])} className={`rounded-lg px-2.5 py-1.5 text-xs font-extrabold outline-none ${statusStyle(submission.reviewStatus)}`}><option value="valid">Valid</option><option value="needs_review">Needs review</option><option value="excluded">Excluded</option></select></td><td className="px-5 py-4"><div className="flex items-center gap-1"><Button variant="quiet" className="min-h-9 px-3 text-xs" onClick={() => void openSignature(submission.id)}><Eye className="size-3.5" aria-hidden="true" />View</Button><Button variant="quiet" className="min-h-9 px-3 text-xs text-rose-700 hover:bg-rose-50 hover:text-rose-800" loading={deletingId === submission.id} disabled={deletingId !== null} onClick={() => void removeSubmission(submission)}><Trash2 className="size-3.5" aria-hidden="true" />{deletingId === submission.id ? 'Deleting…' : 'Delete'}</Button></div></td></tr>)}</tbody></table></div><div className="flex items-center justify-between gap-3 border-t border-slate-100 px-5 py-4 text-sm"><span className="font-medium text-slate-600">{data.total} record{data.total === 1 ? '' : 's'}</span><div className="flex gap-2"><Button variant="quiet" className="min-h-9 px-3 text-xs" disabled={page === 1} onClick={() => setPage((current) => current - 1)}>Previous</Button><span className="grid place-items-center px-1 text-xs font-bold text-slate-600">{page} / {totalPages}</span><Button variant="quiet" className="min-h-9 px-3 text-xs" disabled={page >= totalPages} onClick={() => setPage((current) => current + 1)}>Next</Button></div></div></Card>}
    <a href="/admin/exports" className="mt-5 inline-flex items-center gap-2 text-sm font-bold text-blue-700 hover:text-blue-900"><ExternalLink className="size-4" aria-hidden="true" />Generate authorized PDF export</a>
  </div></AdminShell>
}
