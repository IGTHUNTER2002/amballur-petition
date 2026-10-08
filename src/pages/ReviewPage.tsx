import { useState } from 'react'
import { CheckCircle2, Edit3, FileText, LockKeyhole } from 'lucide-react'
import { Navigate, useNavigate } from 'react-router-dom'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { ProgressSteps } from '../components/petition/ProgressSteps'
import { useLanguage } from '../context/LanguageContext'
import { usePetitionDraft } from '../context/PetitionContext'
import { copy, localize } from '../i18n/copy'
import { usePublicPetition } from '../hooks/usePublicPetition'
import { submitPetition } from '../services/submission-service'
import { Turnstile } from '../components/petition/Turnstile'

export function ReviewPage() {
  const { language } = useLanguage()
  const { data: petition, isLoading, error } = usePublicPetition()
  const { draft, idempotencyKey, recordConfirmation, setTurnstileToken } = usePetitionDraft()
  const navigate = useNavigate()
  const [submitError, setSubmitError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)
  if (isLoading) return <PageSpinner label={copy.loading[language]} />
  if (error || !petition) return <main className="mx-auto max-w-xl px-4 py-16"><InlineError>{language === 'en' ? 'The petition is not available.' : 'ഹർജി ലഭ്യമല്ല.'}</InlineError></main>
  if (!draft.signatureDataUrl || !draft.consent) return <Navigate to="/sign/signature" replace />

  const selectedWard = petition.wards.find((ward) => ward.id === draft.resident.wardId)
  const onSubmit = async () => {
    if (petition.status !== 'published') return
    setSubmitting(true)
    setSubmitError(null)
    try {
      const result = await submitPetition(petition, draft, idempotencyKey, language)
      recordConfirmation(result)
      navigate('/sign/confirmation', { replace: true })
    } catch (nextError) {
      setSubmitError(nextError instanceof Error ? nextError.message : (language === 'en' ? 'We could not submit your signature.' : 'നിങ്ങളുടെ ഒപ്പ് സമർപ്പിക്കാൻ കഴിഞ്ഞില്ല.'))
    } finally {
      setSubmitting(false)
    }
  }

  const details = [
    [copy.form.fullName[language], draft.resident.fullName],
    [copy.form.houseName[language], draft.resident.houseName],
    [copy.form.ward[language], selectedWard ? `${selectedWard.number} — ${selectedWard.name}` : '—'],
    ...(draft.resident.phone ? [[copy.form.phone[language], draft.resident.phone]] : []),
    ...(draft.resident.locality ? [[copy.form.locality[language], draft.resident.locality]] : []),
  ]

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <ProgressSteps step={4} />
      <Card className="mt-8 overflow-hidden">
        <div className="border-b border-slate-100 px-5 py-6 sm:px-8"><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{copy.review.title[language]}</h1><p className="mt-2 text-sm leading-6 text-slate-600">{language === 'en' ? 'Please check each item before securely sending your support.' : 'നിങ്ങളുടെ പിന്തുണ സുരക്ഷിതമായി അയയ്ക്കുന്നതിന് മുമ്പ് ഓരോ വിവരവും പരിശോധിക്കുക.'}</p></div>
        <div className="space-y-5 p-5 sm:p-8">
          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold text-slate-950">{language === 'en' ? 'Your details' : 'നിങ്ങളുടെ വിവരങ്ങൾ'}</h2><Button variant="quiet" onClick={() => navigate('/sign')} className="min-h-9 px-3 text-xs"><Edit3 className="size-3.5" aria-hidden="true" />{copy.review.edit[language]}</Button></div>
            <dl className="mt-4 grid gap-3 text-sm sm:grid-cols-2">
              {details.map(([label, value]) => <div key={label}><dt className="text-xs font-bold uppercase tracking-wide text-slate-500">{label}</dt><dd className="mt-1 font-semibold leading-6 text-slate-800">{value}</dd></div>)}
            </dl>
          </section>
          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5">
            <div className="flex items-start justify-between gap-3"><div><h2 className="flex items-center gap-2 text-sm font-extrabold text-slate-950"><FileText className="size-4 text-blue-700" aria-hidden="true" />{localize(petition.title, language)}</h2><p className="mt-2 text-sm text-slate-600">{copy.review.version[language]} {petition.versionNumber}</p></div><Button variant="quiet" onClick={() => navigate('/')} className="min-h-9 px-3 text-xs"><Edit3 className="size-3.5" aria-hidden="true" />{copy.review.edit[language]}</Button></div>
          </section>
          <section className="rounded-2xl border border-slate-200 p-4 sm:p-5"><div className="flex items-center justify-between gap-3"><h2 className="text-sm font-extrabold text-slate-950">{language === 'en' ? 'Your signature' : 'നിങ്ങളുടെ ഒപ്പ്'}</h2><Button variant="quiet" onClick={() => navigate('/sign/signature')} className="min-h-9 px-3 text-xs"><Edit3 className="size-3.5" aria-hidden="true" />{copy.review.edit[language]}</Button></div><div className="mt-4 rounded-xl border border-slate-200 bg-slate-50 p-2"><img src={draft.signatureDataUrl} alt={language === 'en' ? 'Your captured signature' : 'നിങ്ങളുടെ രേഖപ്പെടുത്തിയ ഒപ്പ്'} className="h-24 w-full rounded-lg bg-white object-contain" /></div></section>
          <div className="flex gap-3 rounded-2xl bg-emerald-50 p-4 text-sm leading-6 text-emerald-950"><CheckCircle2 className="mt-0.5 size-5 shrink-0 text-emerald-700" aria-hidden="true" /><span>{copy.signature.consent[language]}</span></div>
          <div className="flex gap-3 rounded-2xl bg-slate-50 p-4 text-sm leading-6 text-slate-700"><LockKeyhole className="mt-0.5 size-5 shrink-0 text-slate-600" aria-hidden="true" /><span>{copy.review.privacyNote[language]}</span></div>
          <Turnstile onToken={setTurnstileToken} />
          {submitError && <InlineError>{submitError}</InlineError>}
          <Button type="button" onClick={() => void onSubmit()} loading={submitting} disabled={petition.status !== 'published' || Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY) && !draft.turnstileToken} className="w-full min-h-12">{submitting ? copy.review.submitting[language] : copy.review.submit[language]}</Button>
        </div>
      </Card>
    </main>
  )
}
