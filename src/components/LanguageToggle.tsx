import { Languages } from 'lucide-react'
import { useLanguage } from '../context/LanguageContext'

export function LanguageToggle() {
  const { language, setLanguage } = useLanguage()
  return (
    <div className="inline-flex rounded-xl border border-slate-200 bg-white p-1 shadow-sm" aria-label="Language selector">
      <Languages className="my-auto ml-2 size-4 text-slate-500" aria-hidden="true" />
      <button
        type="button"
        onClick={() => setLanguage('en')}
        className={`rounded-lg px-3 py-2 text-xs font-bold transition ${language === 'en' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-950'}`}
        aria-pressed={language === 'en'}
      >
        EN
      </button>
      <button
        type="button"
        onClick={() => setLanguage('ml')}
        className={`rounded-lg px-3 py-2 text-xs font-bold transition ${language === 'ml' ? 'bg-emerald-700 text-white' : 'text-slate-600 hover:text-slate-950'}`}
        aria-pressed={language === 'ml'}
      >
        മലയാളം
      </button>
    </div>
  )
}
