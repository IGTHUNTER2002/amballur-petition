import { Check } from 'lucide-react'
import { copy } from '../../i18n/copy'
import { useLanguage } from '../../context/LanguageContext'

export function ProgressSteps({ step }: { step: number }) {
  const { language } = useLanguage()
  const labels = copy.petitionSteps[language]
  return (
    <ol className="mx-auto flex w-full max-w-xl items-start justify-between gap-1" aria-label="Signing progress">
      {labels.map((label, index) => {
        const number = index + 1
        const completed = number < step
        const current = number === step
        return (
          <li key={label} className="relative flex flex-1 flex-col items-center gap-2 text-center last:flex-none">
            {index > 0 && <span className={`absolute right-1/2 top-4 h-px w-full -translate-y-1/2 ${completed ? 'bg-emerald-600' : 'bg-slate-200'}`} aria-hidden="true" />}
            <span className={`relative z-10 grid size-8 place-items-center rounded-full border-2 text-xs font-extrabold ${completed || current ? 'border-emerald-700 bg-emerald-700 text-white' : 'border-slate-200 bg-white text-slate-500'}`}>
              {completed ? <Check className="size-4" aria-label="Completed" /> : number}
            </span>
            <span className={`text-[11px] font-bold leading-4 sm:text-xs ${current ? 'text-emerald-800' : 'text-slate-500'}`}>{label}</span>
          </li>
        )
      })}
    </ol>
  )
}
