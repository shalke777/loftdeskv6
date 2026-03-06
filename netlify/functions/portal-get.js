const { createClient } = require('@supabase/supabase-js')

const ALLOWED_ORIGINS = [
  'https://magical-meringue-048a06.netlify.app',
  'https://loftdesk.pl',
  'https://www.loftdesk.pl',
  'http://localhost:5173',
  'http://localhost:4173',
]

const sb = () => createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY,
  { auth: { persistSession: false } }
)

const RATE_LIMIT = new Map()
function rateLimit(ip, max = 60, windowMs = 60000) {
  const now = Date.now()
  const entry = RATE_LIMIT.get(ip) || { count: 0, reset: now + windowMs }
  if (now > entry.reset) { entry.count = 0; entry.reset = now + windowMs }
  entry.count += 1
  RATE_LIMIT.set(ip, entry)
  return entry.count <= max
}

function corsOrigin(event) {
  const origin = event.headers?.origin || ''
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0]
}

exports.handler = async (event) => {
  const origin = corsOrigin(event)
  const headers = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Headers': 'Content-Type',
    'Content-Type': 'application/json',
    'Vary': 'Origin',
  }

  if (event.httpMethod === 'OPTIONS') return { statusCode: 200, headers, body: '' }

  const ip = event.headers['x-forwarded-for'] || 'unknown'
  if (!rateLimit(ip)) return { statusCode: 429, headers, body: JSON.stringify({ error: 'too_many_requests' }) }

  const token = event.queryStringParameters?.token
  if (!token || typeof token !== 'string' || token.length > 100) {
    return { statusCode: 400, headers, body: JSON.stringify({ error: 'missing_token' }) }
  }

  try {
    const { data: tok, error } = await sb()
      .from('client_tokens')
      .select('*')
      .eq('token', token)
      .eq('active', true)
      .single()

    if (error || !tok) return { statusCode: 404, headers, body: JSON.stringify({ error: 'not_found' }) }
    if (new Date(tok.expires_at) < new Date()) return { statusCode: 410, headers, body: JSON.stringify({ error: 'expired' }) }

    const [{ data: ce }, { data: items }, { data: prof }, { data: msgs }] = await Promise.all([
      sb().from('cost_estimates').select('id,number,name,status,total_net,total_gross,created_at').eq('id', tok.cost_estimate_id).single(),
      sb().from('cost_estimate_items').select('id,name,description,unit,quantity,unit_price,vat_rate,sort_order').eq('cost_estimate_id', tok.cost_estimate_id).order('sort_order'),
      sb().from('profiles').select('company,full_name,logo_base64,email,phone').eq('id', tok.user_id).single(),
      sb().from('portal_messages').select('id,sender,content,read,created_at').eq('token_id', tok.id).order('created_at'),
    ])

    return {
      statusCode: 200, headers,
      body: JSON.stringify({
        token: { id: tok.id, client_name: tok.client_name, expires_at: tok.expires_at },
        estimate: { ...ce, items: items || [] },
        contractor: prof,
        messages: msgs || [],
      })
    }
  } catch (e) {
    console.error('portal-get error:', e)
    return { statusCode: 500, headers, body: JSON.stringify({ error: 'server_error' }) }
  }
}
