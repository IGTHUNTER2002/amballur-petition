import { HeartHandshake, LockKeyhole } from 'lucide-react'
import { Link, Outlet } from 'react-router-dom'
import { AppMark } from '../components/ui'
import { LanguageToggle } from '../components/LanguageToggle'
import { useLanguage } from '../hooks/useLanguage'
import { copy } from '../i18n/copy'

export function PublicLayout() {
  const { language } = useLanguage()

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#f7fbfa_0%,#ffffff_40%)] text-slate-900">
      <header className="border-b border-slate-200/80 bg-white/85 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3 sm:px-6">
          <Link to="/" aria-label="Safer Streets home"><AppMark /></Link>
          <LanguageToggle />
        </div>
      </header>
      <Outlet />
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-3 px-4 py-6 text-sm text-slate-600 sm:flex-row sm:items-center sm:justify-between sm:px-6">
          <p className="flex items-center gap-2">
            <HeartHandshake className="size-4 text-emerald-700" aria-hidden="true" />
            {copy.footer.humaneAction[language]}
          </p>
          <div className="flex flex-wrap items-center gap-4 sm:gap-6">
            <span className="font-medium text-slate-500">
              {copy.footer.createdBy[language]}
            </span>
            <Link className="inline-flex items-center gap-2 font-bold text-emerald-800 hover:text-emerald-950" to="/privacy">
              <LockKeyhole className="size-4" aria-hidden="true" />
              {copy.footer.privacyNotice[language]}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  )
}
