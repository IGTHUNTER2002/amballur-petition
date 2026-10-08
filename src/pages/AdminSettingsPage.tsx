import { useState } from 'react'
import { Plus, Save, Trash2 } from 'lucide-react'
import { useQueryClient } from '@tanstack/react-query'
import { AdminShell } from '../components/admin/AdminShell'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { useAdminPetition } from '../hooks/useAdminPetition'
import { savePetitionSettings } from '../services/admin-service'
import type { PublicPetition, Ward } from '../types/petition'

function clonePetition(petition: PublicPetition): PublicPetition {
  return JSON.parse(JSON.stringify(petition)) as PublicPetition
}

export function AdminSettingsPage() {
  const { data: petition, isLoading, error } = useAdminPetition()
  const [prevPetition, setPrevPetition] = useState(petition)
  const [draft, setDraft] = useState<PublicPetition | null>(() => petition ? clonePetition(petition) : null)
  const queryClient = useQueryClient()
  if (petition !== prevPetition) {
    setPrevPetition(petition)
    if (petition) setDraft(clonePetition(petition))
  }
  const [notice, setNotice] = useState<string | null>(null)
  const [saveError, setSaveError] = useState<string | null>(null)
  const [saving, setSaving] = useState(false)
  if (isLoading || !draft) return <AdminShell><PageSpinner label="Loading petition settings…" /></AdminShell>
  if (error) return <AdminShell><InlineError>Petition settings could not be loaded.</InlineError></AdminShell>

  const setEnglish = (key: 'title' | 'panchayatName' | 'recipientDetails' | 'body' | 'privacyNotice', value: string) => setDraft((current) => current ? { ...current, [key]: { ...current[key], en: value } } : current)
  const setMalayalam = (key: 'title' | 'panchayatName' | 'recipientDetails' | 'body' | 'privacyNotice', value: string) => setDraft((current) => current ? { ...current, [key]: { ...current[key], ml: value } } : current)
  const updateWard = (index: number, changes: Partial<Ward>) => setDraft((current) => current ? { ...current, wards: current.wards.map((ward, wardIndex) => wardIndex === index ? { ...ward, ...changes } : ward) } : current)
  const save = async () => {
    setSaveError(null); setNotice(null); setSaving(true)
    try {
      await savePetitionSettings(draft)
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-petition'] }),
        queryClient.invalidateQueries({ queryKey: ['published-petition'] }),
      ])
      setNotice('Settings saved. If the official wording changed, the server created a new petition version before publishing it.')
    } catch (nextError) {
      setSaveError(nextError instanceof Error ? nextError.message : 'The settings could not be saved.')
    } finally {
      setSaving(false)
    }
  }

  const bilingualField = (key: 'title' | 'panchayatName' | 'recipientDetails' | 'body' | 'privacyNotice', label: string, multiline = false) => {
    const Input = multiline ? 'textarea' : 'input'
    return <div className="grid gap-4 rounded-2xl border border-slate-200 p-4 sm:grid-cols-2"><div><label className="text-sm font-extrabold text-slate-800">{label} · English</label><Input value={draft[key].en} onChange={(event) => setEnglish(key, event.target.value)} {...(multiline ? { rows: key === 'body' ? 7 : 4 } : {})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></div><div><label className="text-sm font-extrabold text-slate-800">{label} · മലയാളം</label><Input value={draft[key].ml} onChange={(event) => setMalayalam(key, event.target.value)} {...(multiline ? { rows: key === 'body' ? 7 : 4 } : {})} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100" /></div></div>
  }

  return <AdminShell><div className="max-w-5xl"><div><p className="text-sm font-bold text-emerald-800">Single administrator</p><h1 className="mt-1 text-3xl font-black tracking-tight text-slate-950">Petition settings</h1><p className="mt-2 text-sm leading-6 text-slate-600">Update official wording carefully. Material changes produce a new version so each signature remains linked to the text that was agreed to.</p></div>
    <div className="mt-7 space-y-5"><Card className="p-5 sm:p-6"><h2 className="text-lg font-extrabold text-slate-950">Publication</h2><div className="mt-5 grid gap-4 sm:grid-cols-3"><div><label className="text-sm font-bold text-slate-700">Status</label><select value={draft.status} onChange={(event) => setDraft({ ...draft, status: event.target.value as PublicPetition['status'] })} className="mt-2 w-full rounded-xl border border-slate-300 bg-white px-3 py-3 text-sm outline-none focus:border-emerald-600"><option value="draft">Draft</option><option value="published">Published</option><option value="closed">Closed</option><option value="archived">Archived</option></select></div><div><label className="text-sm font-bold text-slate-700">Closing date</label><input type="date" value={draft.closingDate?.slice(0, 10) ?? ''} onChange={(event) => setDraft({ ...draft, closingDate: event.target.value || null })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600" /></div><div><label className="text-sm font-bold text-slate-700">Privacy contact email</label><input type="email" value={draft.contactEmail ?? ''} onChange={(event) => setDraft({ ...draft, contactEmail: event.target.value || null })} className="mt-2 w-full rounded-xl border border-slate-300 px-3 py-3 text-sm outline-none focus:border-emerald-600" /></div></div></Card>
      <Card className="p-5 sm:p-6"><h2 className="text-lg font-extrabold text-slate-950">Official petition text</h2><div className="mt-5 space-y-4">{bilingualField('panchayatName', 'Panchayat name')}{bilingualField('recipientDetails', 'Recipient')}{bilingualField('title', 'Petition title')}{bilingualField('body', 'Complaint text', true)}{bilingualField('privacyNotice', 'Privacy notice', true)}</div></Card>
      <Card className="p-5 sm:p-6"><div className="flex flex-wrap items-center justify-between gap-3"><div><h2 className="text-lg font-extrabold text-slate-950">Ward list</h2><p className="mt-1 text-sm text-slate-600">Residents can choose only a ward configured here.</p></div><Button variant="quiet" onClick={() => setDraft({ ...draft, wards: [...draft.wards, { id: crypto.randomUUID(), number: '', name: '' }] })}><Plus className="size-4" aria-hidden="true" />Add ward</Button></div><div className="mt-5 space-y-3">{draft.wards.map((ward, index) => <div key={ward.id} className="grid gap-3 rounded-xl bg-slate-50 p-3 sm:grid-cols-[8rem_minmax(0,1fr)_auto]"><input aria-label={`Ward number ${index + 1}`} placeholder="Number" value={ward.number} onChange={(event) => updateWard(index, { number: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" /><input aria-label={`Ward name ${index + 1}`} placeholder="Ward name" value={ward.name} onChange={(event) => updateWard(index, { name: event.target.value })} className="rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600" /><Button variant="quiet" className="min-h-10 px-3 text-rose-700" onClick={() => setDraft({ ...draft, wards: draft.wards.filter((_, wardIndex) => wardIndex !== index) })} aria-label={`Remove Ward ${ward.number || index + 1}`}><Trash2 className="size-4" aria-hidden="true" /></Button></div>)}</div></Card>
      {saveError && <InlineError>{saveError}</InlineError>}{notice && <p role="status" className="rounded-xl bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-900">{notice}</p>}
      <div className="flex justify-end"><Button onClick={() => void save()} loading={saving}><Save className="size-4" aria-hidden="true" />Save petition settings</Button></div>
    </div>
  </div></AdminShell>
}
