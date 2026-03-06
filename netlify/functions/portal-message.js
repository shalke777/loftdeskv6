const { createClient } = require('@supabase/supabase-js')

const ALLOWED_ORIGINS = [
  'https://magical-meringue-048a06.netlify.app',
  'https://loftdesk.pl',
  'https://www.loftdesk.pl',
  'http://localhost:5173',
  'http://localhost:4173',
]

const RATE_LIMIT = new Map()
const sb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

function corsOrigin(event) {
  const origin = event.headers?.origin || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

function rateLimit(ip, max = 30, windowMs = 60000) {
  const now = Date.now()
  const entry = RATE_LIMIT.get(ip) || { count: 0, reset: now + windowMs }
  if (now > entry.reset) {
    entry.count = 0
    entry.reset = now + windowMs
  }
  entry.count += 1
  RATE_LIMIT.set(ip, entry)
  return entry.count <= max
}

exports.handler = async (event) => {
  const origin = corsOrigin(event)
  const baseHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers: baseHeaders, body: '' }

  const ip = event.headers['x-forwarded-for'] || 'unknown'
  if (!rateLimit(ip)) return { statusCode: 429, headers: baseHeaders, body: JSON.stringify({ error: 'too_many_requests' }) }

  const token = event.queryStringParameters?.token
  if (!token || typeof token !== 'string' || token.length > 100) {
    return { statusCode: 400, headers: baseHeaders, body: JSON.stringify({ error: 'missing_token' }) }
  }

  try {
    const client = sb()
    const { data: tok, error } = await client
      .from('client_tokens')
      .select('*')
      .eq('token', token)
      .eq('active', true)
      .single()

    if (error || !tok) return { statusCode: 404, headers: baseHeaders, body: JSON.stringify({ error: 'not_found' }) }
    if (new Date(tok.expires_at) < new Date()) return { statusCode: 410, headers: baseHeaders, body: JSON.stringify({ error: 'expired' }) }

    if (event.httpMethod === 'GET') {
      const { data } = await client
        .from('portal_messages')
        .select('id,sender,content,read,created_at')
        .eq('token_id', tok.id)
        .order('created_at')
      return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ messages: data || [] }) }
    }

    if (event.httpMethod !== 'POST') {
      return { statusCode: 405, headers: baseHeaders, body: JSON.stringify({ error: 'method_not_allowed' }) }
    }

    const body = JSON.parse(event.body || '{}')
    const content = typeof body.content === 'string' ? body.content.trim().slice(0, 5000) : ''
    // SECURITY: Always force sender='client' from portal endpoint — prevent spoofing
    const sender = 'client'
    if (!content) return { statusCode: 400, headers: baseHeaders, body: JSON.stringify({ error: 'empty_message' }) }

    const { data: inserted, error: insertError } = await client
      .from('portal_messages')
      .insert({ token_id: tok.id, sender, content, read: false })
      .select('id,sender,content,read,created_at')
      .single()

    if (insertError) throw insertError
    return { statusCode: 200, headers: baseHeaders, body: JSON.stringify({ message: inserted }) }
  } catch (e) {
    console.error('portal-message error:', e)
    return { statusCode: 500, headers: baseHeaders, body: JSON.stringify({ error: 'server_error' }) }
  }
}
