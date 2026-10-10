import { z } from 'npm:zod@3.24.2'
import { corsHeaders, errorResponse, HttpError, json, optionsResponse } from '../_shared/http.ts'
import { serviceClient } from '../_shared/security.ts'

const requestSchema = z.object({ submissionId: z.string().uuid() }).strict()

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

    const { submissionId } = requestSchema.parse(await request.json())
    const { data: submission, error: submissionError } = await client
      .from('submissions')
      .select('signature_path')
      .eq('id', submissionId)
      .maybeSingle()
    if (submissionError || !submission) throw new HttpError(404, 'The signature record was not found.')

    const { data: signed, error: signedError } = await client.storage
      .from('petition-signatures')
      .createSignedUrl(submission.signature_path, 60)
    if (signedError || !signed?.signedUrl) throw new HttpError(503, 'The signature preview link could not be created.')

    return json(request, { signedUrl: signed.signedUrl })
  } catch (error) {
    if (error instanceof z.ZodError) return json(request, { error: 'The signature request is invalid.' }, 400)
    return errorResponse(request, error)
  }
})
