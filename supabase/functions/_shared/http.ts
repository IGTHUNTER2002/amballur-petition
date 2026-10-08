const allowedOrigins = () => new Set(
  (Deno.env.get('ALLOWED_ORIGINS') ?? '')
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
)

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message)
    this.name = 'HttpError'
  }
}

export function corsHeaders(request: Request) {
  const origin = request.headers.get('origin')
  if (origin) {
    const origins = allowedOrigins()
    if (!origins.has(origin)) throw new HttpError(403, 'Origin is not allowed.')
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
  if (error instanceof HttpError) {
    try {
      return json(request, { error: error.message }, error.status)
    } catch {
      return new Response(JSON.stringify({ error: error.message }), { status: error.status, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
    }
  }
  console.error('Unhandled edge-function error', error instanceof Error ? error.message : 'unknown error')
  try {
    return json(request, { error: 'We could not complete that request. Please try again later.' }, 500)
  } catch {
    return new Response(JSON.stringify({ error: 'We could not complete that request. Please try again later.' }), { status: 500, headers: { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' } })
  }
}
