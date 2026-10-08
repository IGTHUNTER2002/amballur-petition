import { CheckCircle2, Copy, MessageCircle } from 'lucide-react'
import { Link, Navigate } from 'react-router-dom'
import { Button, Card } from '../components/ui'
import { useLanguage } from '../context/LanguageContext'
import { usePetitionDraft } from '../context/PetitionContext'
import { copy } from '../i18n/copy'
import { formatDate } from '../lib/utils'

export function ConfirmationPage() {
  const { language } = useLanguage()
  const { confirmation } = usePetitionDraft()
  if (!confirmation) return <Navigate to="/" replace />
  const share = async () => {
    const message = `${copy.confirmation.shareText[language]} ${window.location.origin}`
    if (navigator.share) {
      await navigator.share({ title: 'Safer Streets', text: message, url: window.location.origin })
      return
    }
    window.open(`https://wa.me/?text=${encodeURIComponent(message)}`, '_blank', 'noopener,noreferrer')
  }
  return (
    <main className="mx-auto max-w-xl px-4 py-12 sm:px-6 sm:py-16">
      <Card className="overflow-hidden text-center">
        <div className="bg-[radial-gradient(circle_at_50%_0%,#d1fae5_0%,#ffffff_62%)] px-6 pb-9 pt-10"><span className="mx-auto grid size-16 place-items-center rounded-full bg-emerald-700 text-white shadow-lg shadow-emerald-900/20"><CheckCircle2 className="size-9" aria-hidden="true" /></span><h1 className="mt-5 text-3xl font-black tracking-tight text-slate-950">{copy.confirmation.title[language]}</h1><p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-600">{language === 'en' ? 'Your support has been securely recorded. Please keep this reference if you need to contact the petition administrator.' : 'നിങ്ങളുടെ പിന്തുണ സുരക്ഷിതമായി രേഖപ്പെടുത്തി. ഹർജി അഡ്മിനിസ്ട്രേറ്ററെ ബന്ധപ്പെടേണ്ടതുണ്ടെങ്കിൽ ഈ റഫറൻസ് സൂക്ഷിക്കുക.'}</p></div>
        <div className="space-y-4 px-6 py-7 text-left">
          <div className="rounded-2xl border border-emerald-100 bg-emerald-50 px-4 py-4"><p className="text-xs font-extrabold uppercase tracking-[0.1em] text-emerald-800">{copy.confirmation.reference[language]}</p><p className="mt-1 break-all text-xl font-black tracking-wide text-emerald-950">{confirmation.reference}</p></div>
          <div className="flex justify-between gap-5 border-b border-slate-100 py-3 text-sm"><span className="font-bold text-slate-500">{copy.confirmation.submitted[language]}</span><span className="font-semibold text-slate-800">{formatDate(confirmation.submittedAt, language === 'en' ? 'en-IN' : 'ml-IN')}</span></div>
          <Button className="w-full" variant="secondary" onClick={() => void share()}><MessageCircle className="size-4" aria-hidden="true" />{copy.confirmation.whatsapp[language]}</Button>
          <Button className="w-full" variant="quiet" onClick={() => void navigator.clipboard.writeText(confirmation.reference)}><Copy className="size-4" aria-hidden="true" />{language === 'en' ? 'Copy reference' : 'റഫറൻസ് പകർത്തുക'}</Button>
          <Link to="/" className="block text-center text-sm font-bold text-emerald-800 hover:text-emerald-950">{language === 'en' ? 'Return to the petition' : 'ഹർജിയിലേക്ക് മടങ്ങുക'}</Link>
        </div>
      </Card>
    </main>
  )
}
