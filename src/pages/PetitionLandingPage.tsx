import { AlertTriangle, ArrowRight, CalendarDays, CheckCircle2, FileText, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import heroImage from '../assets/petition-hero-dogs.webp'
import { Button, Card, InlineError, PageSpinner } from '../components/ui'
import { copy, localize } from '../i18n/copy'
import { useLanguage } from '../hooks/useLanguage'
import { usePublicPetition } from '../hooks/usePublicPetition'
import { isDevelopmentPreview } from '../lib/env'

export function PetitionLandingPage() {
  const { language } = useLanguage()
  const { data: petition, isLoading, error } = usePublicPetition()
  if (isLoading) return <PageSpinner label={copy.loading[language]} />
  if (error || !petition) {
    return (
      <main className="mx-auto max-w-xl px-4 py-16 sm:px-6"><InlineError>{language === 'en' ? 'The petition could not be loaded. Please try again later.' : 'ഹർജി ലഭ്യമാക്കാൻ കഴിഞ്ഞില്ല. ദയവായി പിന്നീട് ശ്രമിക്കുക.'}</InlineError></main>
    )
  }

  const isClosed = petition.status !== 'published'
  return (
    <main>
      {isDevelopmentPreview && (
        <div className="border-b border-amber-200 bg-amber-50 px-4 py-2 text-center text-xs font-bold text-amber-900">
          Preview mode — connect Supabase and publish the petition before accepting signatures.
        </div>
      )}
      <section className="mx-auto grid max-w-6xl gap-8 px-4 pb-10 pt-8 sm:px-6 lg:grid-cols-[minmax(0,1.02fr)_minmax(22rem,.98fr)] lg:items-center lg:gap-12 lg:py-14">
        <div className="order-2 lg:order-1">
          <p className="mb-3 inline-flex items-center gap-2 rounded-full bg-emerald-50 px-3 py-1.5 text-xs font-extrabold uppercase tracking-[0.08em] text-emerald-800"><ShieldCheck className="size-4" aria-hidden="true" /> {copy.petition[language]}</p>
          <h1 className="max-w-2xl text-4xl font-black tracking-[-0.035em] text-slate-950 sm:text-5xl sm:leading-[1.06]">{localize(petition.title, language)}</h1>
          <p className="mt-5 text-lg font-semibold text-emerald-800">{localize(petition.panchayatName, language)}</p>
          <p className="mt-5 max-w-2xl text-base leading-8 text-slate-700">{localize(petition.body, language)}</p>
          <div className="mt-7 flex flex-wrap gap-3">
            {isClosed ? (
              <span className="inline-flex items-center gap-2 rounded-xl bg-slate-100 px-4 py-3 text-sm font-bold text-slate-600"><AlertTriangle className="size-4" aria-hidden="true" />{copy.closed[language]}</span>
            ) : (
              <Link to="/sign"><Button className="min-h-12 px-5">{copy.continue[language]}<ArrowRight className="size-4" aria-hidden="true" /></Button></Link>
            )}
            <a href="#petition-text" className="inline-flex min-h-12 items-center rounded-xl border border-slate-200 bg-white px-4 text-sm font-bold text-slate-700 transition hover:bg-slate-50">{language === 'en' ? 'Read the petition' : 'ഹർജി വായിക്കുക'}</a>
          </div>
        </div>
        <div className="order-1 overflow-hidden rounded-[2rem] border border-slate-200 bg-slate-100 shadow-xl shadow-emerald-950/10 lg:order-2">
          <img src={heroImage} alt={language === 'en' ? 'A group of alert stray dogs on a Kerala residential road' : 'കേരളത്തിലെ ഒരു താമസമേഖലയിലെ റോഡിൽ ജാഗ്രതയോടെ നിൽക്കുന്ന തെരുവുനായകളുടെ കൂട്ടം'} className="aspect-[16/11] h-full w-full object-cover" />
        </div>
      </section>

      <section id="petition-text" className="border-y border-slate-200 bg-white">
        <div className="mx-auto grid max-w-6xl gap-5 px-4 py-10 sm:px-6 lg:grid-cols-[minmax(0,1fr)_21rem] lg:gap-12 lg:py-14">
          <Card className="p-6 sm:p-8">
            <div className="flex items-start gap-3">
              <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-blue-50 text-blue-700"><FileText className="size-5" aria-hidden="true" /></span>
              <div><p className="text-xs font-extrabold uppercase tracking-[0.12em] text-blue-700">{localize(petition.recipientDetails, language)}</p><h2 className="mt-2 text-2xl font-black tracking-tight text-slate-950">{localize(petition.title, language)}</h2></div>
            </div>
            <p className="mt-6 whitespace-pre-line text-base leading-8 text-slate-700">{localize(petition.body, language)}</p>
          </Card>
          <aside className="space-y-4">
            <Card className="p-6">
              <h2 className="text-sm font-extrabold uppercase tracking-[0.1em] text-slate-500">{language === 'en' ? 'Requested action' : 'ആവശ്യപ്പെടുന്ന നടപടി'}</h2>
              <ol className="mt-4 space-y-4">
                {petition.requestedActions.map((action, index) => <li key={action.en} className="flex gap-3 text-sm leading-6 text-slate-700"><span className="grid size-6 shrink-0 place-items-center rounded-full bg-emerald-700 text-xs font-extrabold text-white">{index + 1}</span>{localize(action, language)}</li>)}
              </ol>
            </Card>
            {petition.closingDate && <Card className="flex gap-3 p-5 text-sm text-slate-700"><CalendarDays className="size-5 shrink-0 text-emerald-700" aria-hidden="true" /><span>{language === 'en' ? `Open until ${new Date(petition.closingDate).toLocaleDateString('en-IN')}` : `അവസാന തീയതി: ${new Date(petition.closingDate).toLocaleDateString('ml-IN')}`}</span></Card>}
          </aside>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 lg:py-14">
        <div className="grid gap-4 md:grid-cols-3">
          {[
            { icon: FileText, title: language === 'en' ? 'Read first' : 'ആദ്യം വായിക്കുക', detail: language === 'en' ? 'The complete petition is available before you choose to sign.' : 'ഒപ്പിടാൻ തീരുമാനിക്കുന്നതിന് മുമ്പ് പൂർണ ഹർജി വായിക്കാം.' },
            { icon: ShieldCheck, title: language === 'en' ? 'Your consent matters' : 'നിങ്ങളുടെ സമ്മതം പ്രധാനമാണ്', detail: language === 'en' ? 'We ask for an explicit agreement before any signature is submitted.' : 'ഒപ്പ് സമർപ്പിക്കുന്നതിന് മുമ്പ് വ്യക്തമായ സമ്മതം ചോദിക്കുന്നു.' },
            { icon: CheckCircle2, title: language === 'en' ? 'Humanely focused' : 'മാനുഷികമായ സമീപനം', detail: language === 'en' ? 'The request supports public safety alongside lawful animal welfare.' : 'നിയമാനുസൃത മൃഗക്ഷേമത്തോടൊപ്പം പൊതുസുരക്ഷയും ഈ ഹർജി പിന്തുണയ്ക്കുന്നു.' },
          ].map(({ icon: Icon, title, detail }) => <Card key={title} className="p-5"><Icon className="size-5 text-emerald-700" aria-hidden="true" /><h2 className="mt-4 text-base font-extrabold text-slate-950">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-600">{detail}</p></Card>)}
        </div>
      </section>
    </main>
  )
}
