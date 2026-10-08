function isOriginAllowed(origin: string): boolean {
  if (!origin) return true
  const rawConfig = Deno.env.get('ALLOWED_ORIGINS') ?? ''
  const configured = rawConfig.split(',').map((o) => o.trim()).filter(Boolean)
  return configured.includes(origin)
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin')
  if (origin && !isOriginAllowed(origin)) {
    throw new HttpError(403, 'Origin is not allowed.')
  }
  return {
    ...(origin ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Access-Control-Allow-Headers': 'authorization, apikey, content-type, x-client-info, x-idempotency-key',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }
}

export function optionsResponse(request: Request) {
  return new Response(null, { status: 204, headers: corsHeaders(request) })
}

export function json(request: Request, body: unknown, status = 200) {
  return new Response(JSON.stringify(body), { status, headers: corsHeaders(request) })
}

export function errorResponse(request: Request, error: unknown) {
  const origin = request.headers.get('origin')
  const fallbackHeaders = {
    ...(origin && isOriginAllowed(origin) ? { 'Access-Control-Allow-Origin': origin, Vary: 'Origin' } : {}),
    'Content-Type': 'application/json; charset=utf-8',
    'Cache-Control': 'no-store',
  }
  if (error instanceof HttpError) {
    try {
      return json(request, { error: error.message }, error.status)
    } catch {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status, headers: fallbackHeaders })
    }
  }
  console.error('Unhandled edge-function error', error instanceof Error ? error.message : 'unknown error')
  try {
    return json(request, { error: 'We could not complete that request. Please try again later.' }, 500)
  } catch {
    return new Response(JSON.stringify({ error: 'We could not complete that request. Please try again later.' }), { status: 500, headers: fallbackHeaders })
  }
}
