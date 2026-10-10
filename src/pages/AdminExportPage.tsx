import { useState } from 'react'
import { FileDown, FileText, ShieldCheck } from 'lucide-react'
import { AdminShell } from '../components/admin/AdminShell'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { useAdminPetition } from '../hooks/useAdminPetition'
import { exportPetitionPdf } from '../services/admin-service'

export function AdminExportPage() {
  const { data: petition, isLoading, error } = useAdminPetition()
  const [exporting, setExporting] = useState(false)
  const [exportError, setExportError] = useState<string | null>(null)
  const makeExport = async () => {
    if (!petition) return
    setExportError(null); setExporting(true)
    try { window.location.assign(await exportPetitionPdf(petition.id)) } catch (nextError) { setExportError(nextError instanceof Error ? nextError.message : 'The PDF could not be generated.') } finally { setExporting(false) }
  }
  return <AdminShell>{isLoading ? <PageSpinner label="Preparing export…" /> : error || !petition ? <InlineError>The current petition could not be loaded.</InlineError> : <div className="max-w-3xl"><p className="text-sm font-bold text-emerald-800">Authorized export</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Petition PDF</h1><p className="mt-2 text-sm leading-6 text-slate-600">Generate a server-validated A4 complaint and signature register. The export is recorded in the administrator audit log.</p><Card className="mt-7 overflow-hidden"><div className="bg-slate-950 p-6 text-white sm:p-8"><FileText className="size-8 text-emerald-300" aria-hidden="true" /><h2 className="mt-5 text-2xl font-black">{petition.title.en}</h2><p className="mt-2 text-sm leading-6 text-slate-300">Version {petition.versionNumber} · {petition.panchayatName.en}</p></div><div className="space-y-5 p-6 sm:p-8"><ul className="space-y-3 text-sm leading-6 text-slate-700"><li className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-emerald-700" aria-hidden="true" />Formal complaint heading, bilingual petition text, requested actions, and page numbers.</li><li className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-emerald-700" aria-hidden="true" />Only current valid submissions, with captured electronic signatures and no phone numbers.</li><li className="flex gap-3"><ShieldCheck className="mt-1 size-4 shrink-0 text-emerald-700" aria-hidden="true" />A note clarifying that signatures were electronically captured, not cryptographically certified.</li></ul>{exportError && <InlineError>{exportError}</InlineError>}<Button className="w-full sm:w-auto" onClick={() => void makeExport()} loading={exporting}><FileDown className="size-4" aria-hidden="true" />{exporting ? 'Generating secure PDF…' : 'Generate PDF export'}</Button></div></Card></div>}</AdminShell>
}
