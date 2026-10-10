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
      .select('id, submission_reference, resident_name, phone')
      .eq('id', submissionId)
      .maybeSingle()
    if (submissionError || !submission) throw new HttpError(404, 'The resident record was not found.')

    const { error: updateError } = await client
      .from('submissions')
      .update({ phone: null, phone_normalized: null })
      .eq('id', submission.id)
    if (updateError) throw new HttpError(503, 'The phone number could not be removed safely.')

    const { error: auditError } = await client.from('admin_audit_logs').insert({
      admin_id: userData.user.id,
      action: 'remove_submission_phone',
      entity_type: 'submission',
      entity_id: submission.id,
      details: { reference: submission.submission_reference, residentName: submission.resident_name, hadPhone: Boolean(submission.phone) },
    })
    if (auditError) console.error('Phone removal completed but the audit record could not be written.', auditError.message)

    return json(request, { ok: true, alreadyEmpty: !submission.phone })
  } catch (error) {
    if (error instanceof z.ZodError) return json(request, { error: 'The phone removal request is invalid.' }, 400)
    return errorResponse(request, error)
  }
})