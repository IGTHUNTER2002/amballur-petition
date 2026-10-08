import { corsHeaders, errorResponse, json, optionsResponse } from '../_shared/http.ts'
import { serviceClient } from '../_shared/security.ts'

Deno.serve(async (request) => {
  try {
    if (request.method === 'OPTIONS') return optionsResponse(request)
    if (request.method !== 'GET') return json(request, { error: 'Method not allowed.' }, 405)
    corsHeaders(request)
    const client = serviceClient()
    const { data, error } = await client.rpc('get_public_petition')
    if (error || !data) return json(request, { error: 'The petition is not currently available.' }, 404)
    return json(request, data)
  } catch (error) {
    return errorResponse(request, error)
  }
})
