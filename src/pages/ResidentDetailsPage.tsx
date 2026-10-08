import { useState } from 'react'
import { ArrowLeft, ArrowRight, Info } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { ProgressSteps } from '../components/petition/ProgressSteps'
import { useLanguage } from '../context/LanguageContext'
import { usePetitionDraft } from '../context/PetitionContext'
import { copy } from '../i18n/copy'
import { residentSchema } from '../lib/validation'
import { usePublicPetition } from '../hooks/usePublicPetition'

type FieldName = 'fullName' | 'houseName' | 'wardId' | 'phone' | 'locality' | 'incidentDescription'
type FormErrors = Partial<Record<FieldName, string>>

function fieldLabel(field: FieldName, language: 'en' | 'ml') {
  const labels = copy.form
  const label = labels[field === 'fullName' ? 'fullName' : field === 'houseName' ? 'houseName' : field === 'wardId' ? 'ward' : field === 'phone' ? 'phone' : field === 'locality' ? 'locality' : 'incident'][language]
  return label
}

export function ResidentDetailsPage() {
  const { language } = useLanguage()
  const { draft, updateResident } = usePetitionDraft()
  const { data: petition, isLoading, error } = usePublicPetition()
  const navigate = useNavigate()
  const [errors, setErrors] = useState<FormErrors>({})
  if (isLoading) return <PageSpinner label={copy.loading[language]} />
  if (error || !petition) return <main className="mx-auto max-w-xl px-4 py-16"><InlineError>{language === 'en' ? 'The petition is not available.' : 'ഹർജി ലഭ്യമല്ല.'}</InlineError></main>

  const onSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const parsed = residentSchema.safeParse(draft.resident)
    if (!parsed.success) {
      const next: FormErrors = {}
      parsed.error.issues.forEach((issue) => {
        const key = issue.path[0] as FieldName
        if (!next[key]) next[key] = language === 'en' ? issue.message : `${fieldLabel(key, language)} നൽകുക.`
      })
      setErrors(next)
      return
    }
    setErrors({})
    navigate('/sign/signature')
  }

  const inputClass = (field: FieldName) => `mt-2 w-full rounded-xl border bg-white px-3.5 py-3 text-base text-slate-900 outline-none transition placeholder:text-slate-400 focus:border-emerald-600 focus:ring-4 focus:ring-emerald-100 ${errors[field] ? 'border-rose-500' : 'border-slate-300'}`
  const required = () => <span className="ml-1 text-rose-600" aria-label={copy.required[language]}>*</span>
  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <ProgressSteps step={2} />
      <Card className="mt-8 p-5 sm:p-8">
        <h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{language === 'en' ? 'Your details' : 'നിങ്ങളുടെ വിവരങ്ങൾ'}</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">{language === 'en' ? 'Please provide only the details needed to support this petition.' : 'ഈ ഹർജിയെ പിന്തുണയ്ക്കാൻ ആവശ്യമായ വിവരങ്ങൾ മാത്രം നൽകുക.'}</p>
        <form className="mt-7 space-y-5" onSubmit={onSubmit} noValidate>
          <div>
            <label htmlFor="fullName" className="text-sm font-extrabold text-slate-800">{copy.form.fullName[language]}{required()}</label>
            <input id="fullName" autoComplete="name" value={draft.resident.fullName} onChange={(e) => updateResident({ fullName: e.target.value })} className={inputClass('fullName')} aria-invalid={Boolean(errors.fullName)} aria-describedby={errors.fullName ? 'fullName-error' : undefined} />
            {errors.fullName && <p id="fullName-error" className="mt-1.5 text-sm font-medium text-rose-700">{errors.fullName}</p>}
          </div>
          <div>
            <label htmlFor="houseName" className="text-sm font-extrabold text-slate-800">{copy.form.houseName[language]}{required()}</label>
            <input id="houseName" autoComplete="street-address" value={draft.resident.houseName} onChange={(e) => updateResident({ houseName: e.target.value })} className={inputClass('houseName')} aria-invalid={Boolean(errors.houseName)} aria-describedby={errors.houseName ? 'houseName-error' : undefined} />
            {errors.houseName && <p id="houseName-error" className="mt-1.5 text-sm font-medium text-rose-700">{errors.houseName}</p>}
          </div>
          <div>
            <label htmlFor="wardId" className="text-sm font-extrabold text-slate-800">{copy.form.ward[language]}{required()}</label>
            <select id="wardId" value={draft.resident.wardId} onChange={(e) => updateResident({ wardId: e.target.value })} className={inputClass('wardId')} aria-invalid={Boolean(errors.wardId)} aria-describedby={errors.wardId ? 'wardId-error' : undefined}>
              <option value="">{copy.form.wardPlaceholder[language]}</option>
              {petition.wards.map((ward) => <option key={ward.id} value={ward.id}>{language === 'en' ? `${ward.number} — ${ward.name}` : `${ward.number} — വാർഡ് ${ward.number}`}</option>)}
            </select>
            {errors.wardId && <p id="wardId-error" className="mt-1.5 text-sm font-medium text-rose-700">{errors.wardId}</p>}
          </div>
          <div className="grid gap-5 sm:grid-cols-2">
            <div>
              <label htmlFor="phone" className="text-sm font-extrabold text-slate-800">{copy.form.phone[language]} <span className="font-medium text-slate-500">({copy.form.optional[language]})</span></label>
              <input id="phone" inputMode="tel" autoComplete="tel" value={draft.resident.phone} onChange={(e) => updateResident({ phone: e.target.value })} className={inputClass('phone')} aria-invalid={Boolean(errors.phone)} aria-describedby={errors.phone ? 'phone-error' : undefined} />
              {errors.phone && <p id="phone-error" className="mt-1.5 text-sm font-medium text-rose-700">{errors.phone}</p>}
            </div>
            <div>
              <label htmlFor="locality" className="text-sm font-extrabold text-slate-800">{copy.form.locality[language]} <span className="font-medium text-slate-500">({copy.form.optional[language]})</span></label>
              <input id="locality" autoComplete="address-level3" value={draft.resident.locality} onChange={(e) => updateResident({ locality: e.target.value })} className={inputClass('locality')} />
            </div>
          </div>
          <div>
            <label htmlFor="incidentDescription" className="text-sm font-extrabold text-slate-800">{copy.form.incident[language]} <span className="font-medium text-slate-500">({copy.form.optional[language]})</span></label>
            <textarea id="incidentDescription" rows={4} maxLength={1200} value={draft.resident.incidentDescription} onChange={(e) => updateResident({ incidentDescription: e.target.value })} className={inputClass('incidentDescription')} />
            <p className="mt-2 flex gap-2 text-xs leading-5 text-slate-500"><Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />{copy.form.incidentHint[language]}</p>
          </div>
          <div className="flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
            <Button type="button" variant="quiet" onClick={() => navigate('/')}><ArrowLeft className="size-4" aria-hidden="true" />{copy.back[language]}</Button>
            <Button type="submit">{copy.next[language]}<ArrowRight className="size-4" aria-hidden="true" /></Button>
          </div>
        </form>
      </Card>
    </main>
  )
}
