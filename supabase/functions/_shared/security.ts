import { createClient } from 'npm:@supabase/supabase-js@2.57.4'
import { HttpError } from './http.ts'

export function serviceClient() {
  const url = Deno.env.get('SUPABASE_URL')
  const key = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
  if (!url || !key) throw new HttpError(500, 'The secure submission service is not configured.')
  return createClient(url, key, { auth: { persistSession: false, autoRefreshToken: false } })
}

export async function sha256Hex(input: string) {
  const bytes = new TextEncoder().encode(input)
  const digest = await crypto.subtle.digest('SHA-256', bytes)
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export async function hmacHex(input: string, secret: string) {
  const key = await crypto.subtle.importKey('raw', new TextEncoder().encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign'])
  const signature = await crypto.subtle.sign('HMAC', key, new TextEncoder().encode(input))
  return Array.from(new Uint8Array(signature), (byte) => byte.toString(16).padStart(2, '0')).join('')
}

export function requiredSecret(name: string) {
  const secret = Deno.env.get(name)
  if (!secret || secret.length < 32) throw new HttpError(500, `The ${name} secret is not configured.`)
  return secret
}

export function getClientIp(request: Request) {
  const forwarded = request.headers.get('x-forwarded-for')
  const ip = forwarded?.split(',')[0]?.trim() || request.headers.get('cf-connecting-ip') || 'unknown'
  return ip.slice(0, 80)
}

export function normalizeText(value: string) {
  return value.normalize('NFKC').trim().replace(/\s+/g, ' ').toLocaleLowerCase('en-IN')
}

export function normalizePhone(value: string) {
  const compact = value.replace(/[\s-]/g, '')
  if (compact === '') return ''
  if (/^[6-9]\d{9}$/.test(compact)) return `+91${compact}`
  throw new HttpError(400, 'Enter a valid 10-digit Indian mobile number.')
}

export function pngDataUrlToBytes(dataUrl: string) {
  const match = /^data:image\/png;base64,([A-Za-z0-9+/]+={0,2})$/.exec(dataUrl)
  if (!match) throw new HttpError(400, 'The signature format is invalid.')
  const raw = atob(match[1])
  const bytes = Uint8Array.from(raw, (character) => character.charCodeAt(0))
  if (bytes.byteLength < 100 || bytes.byteLength > 650_000) throw new HttpError(400, 'The signature image size is invalid.')
  const isPng = bytes[0] === 0x89 && bytes[1] === 0x50 && bytes[2] === 0x4e && bytes[3] === 0x47
  if (!isPng) throw new HttpError(400, 'The signature must be a PNG image.')
  return bytes
}
