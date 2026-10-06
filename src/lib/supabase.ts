import { createClient } from '@supabase/supabase-js'
import type { Database } from '../types/database'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Variáveis de ambiente do Supabase ausentes. Configure VITE_SUPABASE_URL e VITE_SUPABASE_ANON_KEY (veja .env.example).',
  )
}

/**
 * Checkbox "Manter conectado" em LoginPage.tsx: quando marcado (padrão),
 * sessão vai pro localStorage (sobrevive fechar o navegador/app). Quando
 * desmarcado, vai pro sessionStorage (some ao fechar a aba/app) — útil pra
 * quem faz login num dispositivo compartilhado da loja. O storage do
 * supabase-js é fixado na criação do client, então essa preferência (lida
 * de `localStorage` — nunca contém segredo, só a flag) decide pra ONDE
 * `setItem` escreve a cada chamada; `getItem` olha os dois porque não dá
 * pra saber de antemão em qual dos dois a sessão atual está.
 */
const CHAVE_MANTER_CONECTADO = 'phoneitz-manter-conectado'

export function definirManterConectado(manter: boolean) {
  localStorage.setItem(CHAVE_MANTER_CONECTADO, String(manter))
}

const storageHibrido = {
  getItem: (key: string) => localStorage.getItem(key) ?? sessionStorage.getItem(key),
  setItem: (key: string, value: string) => {
    const manter = localStorage.getItem(CHAVE_MANTER_CONECTADO) !== 'false'
    ;(manter ? localStorage : sessionStorage).setItem(key, value)
  },
  removeItem: (key: string) => {
    localStorage.removeItem(key)
    sessionStorage.removeItem(key)
  },
}

export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: { storage: storageHibrido },
})

