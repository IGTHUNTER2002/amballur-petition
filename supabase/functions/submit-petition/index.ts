import { z } from 'npm:zod@3.24.2'
import { corsHeaders, errorResponse, HttpError, json, optionsResponse } from '../_shared/http.ts'
import { getClientIp, hmacHex, normalizePhone, normalizeText, pngDataUrlToBytes, requiredSecret, serviceClient, sha256Hex } from '../_shared/security.ts'

const submissionSchema = z.object({
  fullName: z.string().trim().min(2).max(120),
  houseName: z.string().trim().min(1).max(160),
  wardId: z.string().uuid(),
  phone: z.string().trim().max(24),
  locality: z.string().trim().max(160),
  incidentDescription: z.string().trim().max(1200),
  signatureDataUrl: z.string().max(900_000),
  consent: z.literal(true),
  petitionVersionId: z.string().uuid(),
  idempotencyKey: z.string().uuid(),
  locale: z.enum(['en', 'ml']).default('en'),
  turnstileToken: z.string().max(2048).optional(),
}).strict()

async function verifyTurnstile(token: string | undefined, request: Request) {
  const secret = Deno.env.get('TURNSTILE_SECRET_KEY')
  if (!secret) return
  if (!token) throw new HttpError(400, 'Please complete the verification step before submitting.')
  const form = new FormData()
  form.set('secret', secret)
  form.set('response', token)
  form.set('remoteip', getClientIp(request))
  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', { method: 'POST', body: form })
  const result = await response.json() as { success?: boolean }
  if (!result.success) throw new HttpError(400, 'Verification could not be completed. Please try again.')
}

Deno.serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') return optionsResponse(request)
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405)
    corsHeaders(request)
    const contentLength = Number(request.headers.get('content-length') ?? 0)
    if (Number.isFinite(contentLength) && contentLength > 850_000) throw new HttpError(413, 'The request is too large.')
    if (!request.headers.get('content-type')?.includes('application/json')) throw new HttpError(415, 'Expected a JSON request.')

    const payload = submissionSchema.parse(await request.json())
    const idempotencyHeader = request.headers.get('x-idempotency-key')
    if (idempotencyHeader !== payload.idempotencyKey) throw new HttpError(400, 'The submission request is invalid.')

    const hashSecret = requiredSecret('SUBMISSION_HASH_SECRET')
    const client = serviceClient()
    const requestHash = await hmacHex(`${payload.petitionVersionId}:${payload.idempotencyKey}`, hashSecret)
    const { data: existing, error: requestLookupError } = await client.rpc('get_submission_by_request', { p_request_hash: requestHash })
    if (requestLookupError) throw new HttpError(503, 'The submission service is temporarily unavailable.')
    if (existing?.reference && existing?.submittedAt) return json(request, existing)

    const rateKey = await hmacHex(`submission:${getClientIp(request)}`, hashSecret)
    const { data: allowed, error: rateError } = await client.rpc('consume_submission_rate_limit', { p_bucket_key: rateKey, p_limit: 30, p_window_seconds: 600 })
    if (rateError || !allowed) throw new HttpError(429, 'Too many attempts. Please wait a few minutes and try again.')
    await verifyTurnstile(payload.turnstileToken, request)

    const signatureBytes = pngDataUrlToBytes(payload.signatureDataUrl)
    const phone = normalizePhone(payload.phone)
    const normalizedIdentity = `${normalizeText(payload.fullName)}\u001f${normalizeText(payload.houseName)}\u001f${payload.wardId}`
    const identityHmac = await hmacHex(normalizedIdentity, hashSecret)
    const payloadHash = await sha256Hex(JSON.stringify({
      fullName: normalizeText(payload.fullName), houseName: normalizeText(payload.houseName), wardId: payload.wardId,
      phone, locality: normalizeText(payload.locality), incidentDescription: payload.incidentDescription.trim(),
      signature: await sha256Hex(payload.signatureDataUrl), consent: payload.consent, petitionVersionId: payload.petitionVersionId, locale: payload.locale,
    }))
    // Address objects by the complete payload, never just the idempotency key.
    // A retried key with different data must not be able to replace a stored signature.
    const signaturePath = `${payload.petitionVersionId}/${payloadHash}.png`
    const { error: uploadError } = await client.storage.from('petition-signatures').upload(signaturePath, signatureBytes, { contentType: 'image/png', upsert: false, cacheControl: 'private, max-age=0' })
    // A conflict is safe here: the path is derived from the complete SHA-256
    // payload hash, so the existing object represents the same submission data.
    if (uploadError && uploadError.statusCode !== '409') throw new HttpError(503, 'Your signature could not be stored safely. Please try again.')

    const { data, error: submitError } = await client.rpc('create_submission', {
      p_version_id: payload.petitionVersionId,
      p_full_name: payload.fullName,
      p_house_name: payload.houseName,
      p_ward_id: payload.wardId,
      p_phone: phone,
      p_locality: payload.locality,
      p_incident_description: payload.incidentDescription,
      p_signature_path: signaturePath,
      p_consent_at: new Date().toISOString(),
      p_locale: payload.locale,
      p_request_hash: requestHash,
      p_payload_hash: payloadHash,
      p_identity_hmac: identityHmac,
    })
    if (submitError || !data?.reference || !data?.submittedAt) throw new HttpError(503, 'Your signature could not be submitted. Please try again.')
    return json(request, data, 201)
  } catch (error) {
    if (error instanceof z.ZodError) return json(request, { error: 'Please check the information and signature before submitting.' }, 400)
    return errorResponse(request, error)
  }
})
