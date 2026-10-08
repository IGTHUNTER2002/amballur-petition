import { useEffect, useId, useRef, useState } from 'react'

declare global {
  interface Window {
    turnstile?: {
      render: (container: HTMLElement, options: { sitekey: string; callback: (token: string) => void; 'expired-callback': () => void; 'error-callback': () => void; theme: 'light'; size: 'flexible' }) => string
      reset: (widgetId?: string) => void
    }
  }
}

interface TurnstileProps {
  onToken: (token: string | null) => void
}

export function Turnstile({ onToken }: TurnstileProps) {
  const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY as string | undefined
  const elementId = useId().replace(/:/g, '')
  const widgetId = useRef<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!siteKey) return undefined
    const render = () => {
      const container = document.getElementById(elementId)
      if (!container || !window.turnstile || widgetId.current) return
      widgetId.current = window.turnstile.render(container, {
        sitekey: siteKey,
        theme: 'light',
        size: 'flexible',
        callback: (token) => { setError(null); onToken(token) },
        'expired-callback': () => onToken(null),
        'error-callback': () => { onToken(null); setError('Verification could not load. Please refresh and try again.') },
      })
    }
    const existing = document.querySelector<HTMLScriptElement>('script[data-turnstile]')
    if (window.turnstile) render()
    else if (existing) existing.addEventListener('load', render, { once: true })
    else {
      const script = document.createElement('script')
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
      script.async = true
      script.defer = true
      script.dataset.turnstile = 'true'
      script.addEventListener('load', render, { once: true })
      script.addEventListener('error', () => setError('Verification could not load. Please refresh and try again.'), { once: true })
      document.head.appendChild(script)
    }
    return () => {
      if (existing) existing.removeEventListener('load', render)
    }
  }, [elementId, onToken, siteKey])

  if (!siteKey) return null
  return <div className="rounded-xl border border-slate-200 bg-slate-50 p-3"><div id={elementId} /><p className="mt-2 text-xs leading-5 text-slate-500">Human verification helps protect the petition from automated submissions.</p>{error && <p role="alert" className="mt-2 text-xs font-semibold text-rose-700">{error}</p>}</div>
}
