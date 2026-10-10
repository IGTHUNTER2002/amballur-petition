import { z } from 'npm:zod@3.24.2'
import { corsHeaders, errorResponse, HttpError, json, optionsResponse } from '../_shared/http.ts'
import { serviceClient } from '../_shared/security.ts'

const requestSchema = z.object({ petition: z.record(z.unknown()) }).strict()

Deno.serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') return optionsResponse(request)
    if (request.method !== 'POST') return json(request, { error: 'Method not allowed.' }, 405)
    corsHeaders(request)

    const authorization = request.headers.get('authorization')
    if (!authorization?.startsWith('Bearer ')) throw new HttpError(401, 'Administrator authentication is required.')

    const client = serviceClient()
    const { data: userData, error: userError } = await client.auth.getUser(authorization.slice(7))
    if (userError || !userData.user) throw new HttpError(401, 'Administrator authentication is required.')

    const { data: administrator, error: administratorError } = await client
      .from('admin_profiles')
      .select('id')
      .eq('id', userData.user.id)
      .eq('is_active', true)
      .eq('is_primary', true)
      .maybeSingle()
    if (administratorError || !administrator) throw new HttpError(403, 'Administrator access is required.')

    const { petition } = requestSchema.parse(await request.json())
    const url = Deno.env.get('SUPABASE_URL')
    const anonKey = Deno.env.get('SUPABASE_ANON_KEY')
    if (!url || !anonKey) throw new HttpError(500, 'The secure settings service is not configured.')

    const response = await fetch(`${url}/rest/v1/rpc/update_petition_settings`, {
      method: 'POST',
      headers: {
        apikey: anonKey,
        authorization,
        'content-type': 'application/json',
      },
      body: JSON.stringify({ petition_payload: petition }),
    })
    if (!response.ok) {
      const body = await response.json().catch(() => null) as { message?: string } | null
      console.error('Settings update failed.', response.status, body?.message ?? 'no response message')
      throw new HttpError(422, body?.message || 'The petition settings could not be saved.')
    }

    return json(request, { ok: true })
  } catch (error) {
    if (error instanceof z.ZodError) return json(request, { error: 'The petition settings request is invalid.' }, 400)
    return errorResponse(request, error)
  }
})
