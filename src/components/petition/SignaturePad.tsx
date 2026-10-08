import { useCallback, useEffect, useRef, useState } from 'react'
import SignatureCanvas from 'react-signature-canvas'
import { Eraser } from 'lucide-react'
import { Button } from '../ui'
import { useLanguage } from '../../context/LanguageContext'
import { copy } from '../../i18n/copy'

interface SignaturePadProps {
  value: string | null
  onChange: (value: string | null) => void
  disabled?: boolean
}

export function SignaturePad({ value, onChange, disabled = false }: SignaturePadProps) {
  const signatureRef = useRef<SignatureCanvas | null>(null)
  const containerRef = useRef<HTMLDivElement | null>(null)
  const [width, setWidth] = useState(600)
  const { language } = useLanguage()

  useEffect(() => {
    const container = containerRef.current
    if (!container) return undefined
    const observer = new ResizeObserver(([entry]) => setWidth(Math.max(280, Math.floor(entry.contentRect.width))))
    observer.observe(container)
    return () => observer.disconnect()
  }, [])

  const saveSignature = useCallback(() => {
    const signature = signatureRef.current
    const canvas = signature?.getCanvas()
    const context = canvas?.getContext('2d')
    if (!canvas || !context) {
      onChange(null)
      return
    }
    // Use the actual canvas pixels instead of signature_pad's bookkeeping so
    // mouse, touch, and stylus paths are treated identically by browsers.
    const pixels = context.getImageData(0, 0, canvas.width, canvas.height).data
    let hasInk = false
    for (let index = 0; index < pixels.length; index += 4) {
      if (pixels[index] < 220 || pixels[index + 1] < 220 || pixels[index + 2] < 220) {
        hasInk = true
        break
      }
    }
    if (!hasInk) {
      onChange(null)
      return
    }
    onChange(canvas.toDataURL('image/png'))
  }, [onChange])

  const clear = () => {
    signatureRef.current?.clear()
    onChange(null)
  }

  useEffect(() => {
    // signature_pad finalizes its stroke in its own native handler. Queue our
    // snapshot after that handler so the parent only receives complete strokes.
    const captureAfterStroke = () => window.setTimeout(saveSignature, 0)
    window.addEventListener('mouseup', captureAfterStroke)
    window.addEventListener('touchend', captureAfterStroke)
    return () => {
      window.removeEventListener('mouseup', captureAfterStroke)
      window.removeEventListener('touchend', captureAfterStroke)
    }
  }, [width, saveSignature])

  return (
    <div>
      <div ref={containerRef} className={`overflow-hidden rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 p-1 focus-within:border-emerald-600 ${disabled ? 'pointer-events-none opacity-60' : ''}`}>
        <SignatureCanvas
          ref={signatureRef}
          penColor="#0f172a"
          canvasProps={{
            width,
            height: 180,
            className: 'block w-full touch-none rounded-xl bg-white',
            'aria-label': language === 'en' ? 'Signature drawing area' : 'ഒപ്പ് രേഖപ്പെടുത്താനുള്ള സ്ഥലം',
            role: 'img',
          }}
          clearOnResize={false}
          onEnd={saveSignature}
          backgroundColor="rgb(255, 255, 255)"
          velocityFilterWeight={0.7}
          minWidth={0.8}
          maxWidth={2.3}
          throttle={8}
        />
      </div>
      <div className="mt-3 flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-medium text-slate-600">{copy.signature.instruction[language]}</p>
        <div className="flex gap-2">
          <Button type="button" variant="quiet" onClick={saveSignature} disabled={disabled} className="min-h-10 px-3 text-xs">
            {copy.signature.save[language]}
          </Button>
          <Button type="button" variant="quiet" onClick={clear} disabled={disabled} className="min-h-10 px-3 text-xs">
            <Eraser className="size-4" aria-hidden="true" />
            {copy.signature.clear[language]}
          </Button>
        </div>
      </div>
      {value && (
        <p className="mt-3 text-xs font-bold text-emerald-800" role="status">
          {language === 'en' ? 'Signature captured.' : 'ഒപ്പ് രേഖപ്പെടുത്തി.'}
        </p>
      )}
    </div>
  )
}
