import { LockKeyhole, Mail, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Card, PageSpinner } from '../components/ui'
import { useLanguage } from '../hooks/useLanguage'
import { usePublicPetition } from '../hooks/usePublicPetition'
import { localize } from '../i18n/copy'

export function PrivacyPage() {
  const { language } = useLanguage()
  const { data: petition, isLoading } = usePublicPetition()
  if (isLoading) return <PageSpinner />
  const contact = petition?.contactEmail
  return (
    <main className="mx-auto max-w-3xl px-4 py-10 sm:px-6 sm:py-14">
      <Link to="/" className="text-sm font-bold text-emerald-800 hover:text-emerald-950">← {language === 'en' ? 'Back to petition' : 'ഹർജിയിലേക്ക് മടങ്ങുക'}</Link>
      <div className="mt-6 flex gap-4"><span className="grid size-12 shrink-0 place-items-center rounded-2xl bg-emerald-50 text-emerald-700"><LockKeyhole className="size-6" aria-hidden="true" /></span><div><h1 className="text-3xl font-black tracking-tight text-slate-950">{language === 'en' ? 'Privacy notice' : 'സ്വകാര്യതാ അറിയിപ്പ്'}</h1><p className="mt-2 text-base leading-7 text-slate-600">{language === 'en' ? 'How petition information is collected, protected, and used.' : 'ഹർജിയിലെ വിവരങ്ങൾ എങ്ങനെ ശേഖരിക്കുന്നു, സംരക്ഷിക്കുന്നു, ഉപയോഗിക്കുന്നു എന്നത്.'}</p></div></div>
      <Card className="mt-8 space-y-7 p-6 sm:p-8">
        <section><h2 className="text-lg font-extrabold text-slate-950">{language === 'en' ? 'Why we collect information' : 'എന്തിനാണ് വിവരങ്ങൾ ശേഖരിക്കുന്നത്'}</h2><p className="mt-2 text-base leading-8 text-slate-700">{petition ? localize(petition.privacyNotice, language) : language === 'en' ? 'The petition privacy notice is unavailable.' : 'ഹർജിയുടെ സ്വകാര്യതാ അറിയിപ്പ് ലഭ്യമല്ല.'}</p></section>
        <section><h2 className="flex items-center gap-2 text-lg font-extrabold text-slate-950"><ShieldCheck className="size-5 text-emerald-700" aria-hidden="true" />{language === 'en' ? 'Access and retention' : 'പ്രവേശനവും സൂക്ഷിക്കൽ കാലയളവും'}</h2><p className="mt-2 text-base leading-8 text-slate-700">{language === 'en' ? 'Only the authorized petition administrator may access individual submissions. Signature images are stored in a private bucket and never published in a public listing. Records are retained only for the petition, any related Panchayat submission, and legally required audit purposes.' : 'അധികാരപ്പെട്ട ഹർജി അഡ്മിനിസ്ട്രേറ്റർക്ക് മാത്രമാണ് വ്യക്തിഗത സമർപ്പണങ്ങൾ കാണാൻ കഴിയുക. ഒപ്പ് ചിത്രങ്ങൾ സ്വകാര്യ സംഭരണിയിലാണ് സൂക്ഷിക്കുന്നത്; പൊതു ലിസ്റ്റിൽ ഒരിക്കലും പ്രസിദ്ധീകരിക്കില്ല. ഹർജിക്കും ബന്ധപ്പെട്ട പഞ്ചായത്ത് സമർപ്പണത്തിനും നിയമപരമായി ആവശ്യമായ ഓഡിറ്റ് ആവശ്യങ്ങൾക്കുമായി മാത്രം രേഖകൾ സൂക്ഷിക്കും.'}</p></section>
        <section><h2 className="text-lg font-extrabold text-slate-950">{language === 'en' ? 'Your choices' : 'നിങ്ങളുടെ തിരഞ്ഞെടുപ്പുകൾ'}</h2><p className="mt-2 text-base leading-8 text-slate-700">{language === 'en' ? 'Signing is voluntary. You may ask to correct or request deletion of your submission where applicable. Do not include Aadhaar numbers, identity documents, or sensitive information about other people.' : 'ഒപ്പിടൽ പൂർണമായും സ്വമേധയാ ഉള്ളതാണ്. ബാധകമായിടത്ത് നിങ്ങളുടെ സമർപ്പണം തിരുത്താനോ ഇല്ലാതാക്കാനോ അഭ്യർത്ഥിക്കാം. ആധാർ നമ്പർ, തിരിച്ചറിയൽ രേഖകൾ, അല്ലെങ്കിൽ മറ്റുള്ളവരുടെ അതിസൂക്ഷ്മ വിവരങ്ങൾ നൽകരുത്.'}</p></section>
        {contact && <a className="inline-flex items-center gap-2 font-bold text-blue-700 hover:text-blue-900" href={`mailto:${contact}`}><Mail className="size-4" aria-hidden="true" />{language === 'en' ? 'Contact the petition administrator' : 'ഹർജി അഡ്മിനിസ്ട്രേറ്ററെ ബന്ധപ്പെടുക'}</a>}
      </Card>
    </main>
  )
}
