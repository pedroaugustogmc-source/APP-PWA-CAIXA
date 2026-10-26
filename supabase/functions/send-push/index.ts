// Envia notificação push pros dispositivos inscritos de um usuário.
//
// Dois chamadores possíveis, diferenciados pelo JWT que o próprio gateway já
// validou (verify_jwt = true no deploy, então chegou aqui com assinatura ok):
//   - service_role (chamado pelo cron via pg_net): confia no user_id do body.
//   - usuário comum (botão "enviar teste" no app): ignora qualquer user_id do
//     body e usa o "sub" do token — ninguém manda notificação pra conta
//     alheia agindo como usuário comum.
//
// Chaves VAPID vêm do Vault (não de Edge Function Secret) via RPC travado
// phoneitz_segredo_push, só acessível pelo service_role.
import { createClient } from 'jsr:@supabase/supabase-js@2'
import webpush from 'npm:web-push@3.6.7'

const SUPABASE_URL = Deno.env.get('SUPABASE_URL')!
const SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!

// O botão "enviar teste" chama esta função direto do navegador (origem
// diferente da do Supabase) — sem isso, o preflight CORS do fetch falha
// antes mesmo de chegar no Deno.serve. A chamada do cron (server-to-server
// via pg_net) não usa navegador, então não precisa disso, mas não atrapalha.
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

function jsonResponse(body: unknown, status = 200): Response {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  })
}

function decodeJwtPayload(token: string): { sub?: string; role?: string } {
  const parte = token.split('.')[1]
  const normalizada = parte.replace(/-/g, '+').replace(/_/g, '/')
  const padded = normalizada + '='.repeat((4 - (normalizada.length % 4)) % 4)
  return JSON.parse(atob(padded))
}

Deno.serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }
  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405)
  }

  const authHeader = req.headers.get('Authorization') ?? ''
  const token = authHeader.replace(/^Bearer\s+/i, '')
  if (!token) {
    return jsonResponse({ error: 'Sem autenticação' }, 401)
  }

  let payload: { sub?: string; role?: string }
  try {
    payload = decodeJwtPayload(token)
  } catch {
    return jsonResponse({ error: 'Token inválido' }, 401)
  }

  const body = await req.json().catch(() => ({}))
  const isServiceRole = payload.role === 'service_role'
  const userId = isServiceRole ? body.user_id : payload.sub

  if (!userId) {
    return jsonResponse({ error: 'user_id ausente' }, 400)
  }

  const title = typeof body.title === 'string' && body.title.trim() ? body.title : 'PHONEITZ'
  const notifBody = typeof body.body === 'string' && body.body.trim() ? body.body : 'Você tem uma atualização.'
  const url = typeof body.url === 'string' && body.url.trim() ? body.url : '/'

  const admin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY)

  const [{ data: publicKey }, { data: privateKey }, { data: subject }] = await Promise.all([
    admin.rpc('phoneitz_segredo_push', { p_nome: 'vapid_public_key' }),
    admin.rpc('phoneitz_segredo_push', { p_nome: 'vapid_private_key' }),
    admin.rpc('phoneitz_segredo_push', { p_nome: 'vapid_subject' }),
  ])

  if (!publicKey || !privateKey || !subject) {
    return jsonResponse({ error: 'Chaves VAPID não configuradas' }, 500)
  }

  webpush.setVapidDetails(subject, publicKey, privateKey)

  const { data: subs, error: subsError } = await admin
    .from('push_subscriptions')
    .select('id, endpoint, p256dh, auth_key')
    .eq('user_id', userId)

  if (subsError) {
    return jsonResponse({ error: subsError.message }, 500)
  }

  if (!subs || subs.length === 0) {
    return jsonResponse({ sent: 0, failed: 0, removed: 0, aviso: 'Nenhum dispositivo inscrito' })
  }

  const payloadJson = JSON.stringify({ title, body: notifBody, url })

  let sent = 0
  let failed = 0
  const paraRemover: string[] = []

  await Promise.all(
    subs.map(async (sub) => {
      try {
        await webpush.sendNotification(
          { endpoint: sub.endpoint, keys: { p256dh: sub.p256dh, auth: sub.auth_key } },
          payloadJson,
        )
        sent++
      } catch (err) {
        failed++
        const status = (err as { statusCode?: number }).statusCode
        if (status === 404 || status === 410) {
          paraRemover.push(sub.id)
        }
      }
    }),
  )

  if (paraRemover.length > 0) {
    await admin.from('push_subscriptions').delete().in('id', paraRemover)
  }

  return jsonResponse({ sent, failed, removed: paraRemover.length })
})
