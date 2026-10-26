import { supabase } from './supabase'

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY

export type SuportePush = 'suportado' | 'ios_precisa_instalar' | 'nao_suportado'

function rodandoStandalone(): boolean {
  return window.matchMedia('(display-mode: standalone)').matches || (navigator as unknown as { standalone?: boolean }).standalone === true
}

function ehIos(): boolean {
  return /iphone|ipad|ipod/i.test(navigator.userAgent)
}

export function detectarSuportePush(): SuportePush {
  if (!('serviceWorker' in navigator) || !('PushManager' in window) || !('Notification' in window)) {
    return ehIos() ? 'ios_precisa_instalar' : 'nao_suportado'
  }
  if (ehIos() && !rodandoStandalone()) {
    // Safari/iOS só permite push em PWA instalada na tela de início (iOS 16.4+).
    return 'ios_precisa_instalar'
  }
  return 'suportado'
}

function base64UrlParaUint8Array(base64Url: string): Uint8Array {
  const padding = '='.repeat((4 - (base64Url.length % 4)) % 4)
  const base64 = (base64Url + padding).replace(/-/g, '+').replace(/_/g, '/')
  const bruto = atob(base64)
  const saida = new Uint8Array(bruto.length)
  for (let i = 0; i < bruto.length; i++) saida[i] = bruto.charCodeAt(i)
  return saida
}

export async function obterInscricaoAtual(): Promise<PushSubscription | null> {
  if (!('serviceWorker' in navigator)) return null
  const registration = await navigator.serviceWorker.ready
  return registration.pushManager.getSubscription()
}

export async function ativarNotificacoes(): Promise<{ error: string | null }> {
  if (!VAPID_PUBLIC_KEY) {
    return { error: 'Notificações push não configuradas neste ambiente.' }
  }

  const permissao = await Notification.requestPermission()
  if (permissao !== 'granted') {
    return { error: 'Permissão de notificação negada. Ative nas configurações do navegador/app.' }
  }

  let inscricao: PushSubscription
  try {
    const registration = await navigator.serviceWorker.ready
    inscricao = (await registration.pushManager.getSubscription()) ?? (await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: base64UrlParaUint8Array(VAPID_PUBLIC_KEY) as BufferSource,
    }))
  } catch {
    return { error: 'Não foi possível ativar notificações neste dispositivo/navegador.' }
  }

  const json = inscricao.toJSON()
  const { error } = await supabase.from('push_subscriptions').upsert(
    {
      endpoint: inscricao.endpoint,
      p256dh: json.keys?.p256dh ?? '',
      auth_key: json.keys?.auth ?? '',
      user_agent: navigator.userAgent,
    },
    { onConflict: 'endpoint' },
  )

  if (error) return { error: error.message }
  return { error: null }
}

export async function desativarNotificacoes(): Promise<{ error: string | null }> {
  let inscricao: PushSubscription | null
  try {
    inscricao = await obterInscricaoAtual()
  } catch {
    return { error: 'Não foi possível verificar a inscrição atual.' }
  }
  if (!inscricao) return { error: null }

  const endpoint = inscricao.endpoint
  try {
    await inscricao.unsubscribe()
  } catch {
    return { error: 'Não foi possível desativar notificações neste dispositivo/navegador.' }
  }
  const { error } = await supabase.from('push_subscriptions').delete().eq('endpoint', endpoint)
  if (error) return { error: error.message }
  return { error: null }
}

export async function enviarNotificacaoTeste(): Promise<{ error: string | null }> {
  const { error } = await supabase.functions.invoke('send-push', {
    body: { title: 'PHONEITZ', body: 'Notificações ativadas com sucesso.', url: '/' },
  })
  if (error) return { error: error.message }
  return { error: null }
}
