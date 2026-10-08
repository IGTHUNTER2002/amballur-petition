import { useState } from 'react'
import { ArrowLeft, ArrowRight, ShieldCheck } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { ProgressSteps } from '../components/petition/ProgressSteps'
import { SignaturePad } from '../components/petition/SignaturePad'
import { useLanguage } from '../hooks/useLanguage'
import { usePetitionDraft } from '../hooks/usePetitionDraft'
import { copy } from '../i18n/copy'
import { usePublicPetition } from '../hooks/usePublicPetition'
import { toDataUrlSize } from '../lib/utils'

export function SignaturePage() {
  const { language } = useLanguage()
  const { draft, setConsent, setSignature } = usePetitionDraft()
  const { isLoading, error } = usePublicPetition()
  const navigate = useNavigate()
  const [signatureError, setSignatureError] = useState<string | null>(null)
  const [consentError, setConsentError] = useState<string | null>(null)
  if (isLoading) return <PageSpinner label={copy.loading[language]} />
  if (error) return <main className="mx-auto max-w-xl px-4 py-16"><InlineError>{language === 'en' ? 'The petition is not available.' : 'ഹർജി ലഭ്യമല്ല.'}</InlineError></main>

  const continueToReview = () => {
    const signatureTooLarge = draft.signatureDataUrl && toDataUrlSize(draft.signatureDataUrl) > 650_000
    if (!draft.signatureDataUrl || signatureTooLarge) {
      setSignatureError(signatureTooLarge ? (language === 'en' ? 'That signature image is too large. Clear it and sign again.' : 'ഒപ്പ് ചിത്രം വളരെ വലുതാണ്. മായ്ച്ച് വീണ്ടും ഒപ്പിടുക.') : copy.signature.required[language])
      return
    }
    if (!draft.consent) {
      setConsentError(language === 'en' ? 'Please confirm your consent before continuing.' : 'തുടരുന്നതിന് മുമ്പ് ദയവായി നിങ്ങളുടെ സമ്മതം സ്ഥിരീകരിക്കുക.')
      return
    }
    setSignatureError(null)
    setConsentError(null)
    navigate('/sign/review')
  }

  return (
    <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
      <ProgressSteps step={3} />
      <Card className="mt-8 p-5 sm:p-8">
        <div className="flex gap-3"><span className="grid size-11 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><ShieldCheck className="size-5" aria-hidden="true" /></span><div><h1 className="text-2xl font-black tracking-tight text-slate-950 sm:text-3xl">{copy.signature.title[language]}</h1><p className="mt-1 text-sm leading-6 text-slate-600">{copy.signature.instruction[language]}</p></div></div>
        <div className="mt-7">
          <SignaturePad
            value={draft.signatureDataUrl}
            onChange={(value) => {
              setSignature(value)
              if (value) setSignatureError(null)
            }}
          />
          {signatureError && <div className="mt-3"><InlineError>{signatureError}</InlineError></div>}
        </div>
        <label className={`mt-7 flex cursor-pointer gap-3 rounded-2xl border p-4 transition ${consentError ? 'border-rose-400 bg-rose-50' : 'border-emerald-100 bg-emerald-50/70 hover:border-emerald-300'}`}>
          <input
            type="checkbox"
            checked={draft.consent}
            onChange={(event) => {
              setConsent(event.target.checked)
              if (event.target.checked) setConsentError(null)
            }}
            className="mt-1 size-5 shrink-0 accent-emerald-700"
            aria-describedby={consentError ? 'consent-error' : undefined}
          />
          <span className="text-sm font-semibold leading-6 text-slate-800">{copy.signature.consent[language]}</span>
        </label>
        {consentError && <p id="consent-error" className="mt-2 text-sm font-medium text-rose-700">{consentError}</p>}
        <div className="mt-7 flex flex-col-reverse justify-between gap-3 border-t border-slate-100 pt-6 sm:flex-row">
          <Button type="button" variant="quiet" onClick={() => navigate('/sign')}><ArrowLeft className="size-4" aria-hidden="true" />{copy.back[language]}</Button>
          <Button type="button" onClick={continueToReview}>{copy.next[language]}<ArrowRight className="size-4" aria-hidden="true" /></Button>
        </div>
      </Card>
    </main>
  )
}
