import { supabase } from './supabase'
import type { AparelhoInput } from '../hooks/useAparelhos'
import type { Categoria, Fornecedor } from '../types/domain'

/**
 * Fila de ações feitas sem conexão (IndexedDB). Cobre só cadastro de
 * aparelho — venda exige conexão: `concluir_venda` é uma operação atômica
 * multi-tabela via RPC, não um insert simples que dá pra enfileirar e
 * reenviar depois sem risco de corrida (ver supabase/migrations/0019).
 */
export interface PendingCriarAparelho {
  kind: 'criar_aparelho'
  id: string
  createdAt: string
  input: AparelhoInput
  categoriaSnapshot: Categoria | null
  fornecedorSnapshot: Fornecedor | null
}

export type PendingMutation = PendingCriarAparelho

const DB_NAME = 'catira-outbox'
const STORE = 'mutations'

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, 1)
    req.onupgradeneeded = () => {
      if (!req.result.objectStoreNames.contains(STORE)) {
        req.result.createObjectStore(STORE, { keyPath: 'id' })
      }
    }
    req.onsuccess = () => resolve(req.result)
    req.onerror = () => reject(req.error)
  })
}

export async function enqueueMutation(mutation: PendingMutation): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).put(mutation)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

export async function listPendingMutations(): Promise<PendingMutation[]> {
  const db = await openDb()
  const result = await new Promise<PendingMutation[]>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readonly')
    const req = tx.objectStore(STORE).getAll()
    req.onsuccess = () => resolve(req.result as PendingMutation[])
    req.onerror = () => reject(req.error)
  })
  db.close()
  return result.sort((a, b) => a.createdAt.localeCompare(b.createdAt))
}

async function removeMutation(id: string): Promise<void> {
  const db = await openDb()
  await new Promise<void>((resolve, reject) => {
    const tx = db.transaction(STORE, 'readwrite')
    tx.objectStore(STORE).delete(id)
    tx.oncomplete = () => resolve()
    tx.onerror = () => reject(tx.error)
  })
  db.close()
}

let flushing = false

/**
 * Tenta inserir o aparelho de uma mutação pendente, retorna `true` quando a
 * mutação pode ser considerada sincronizada (removida da fila).
 *
 * Dois casos de erro do Postgres são tratados como recuperáveis em vez de
 * deixar a mutação presa na fila pra sempre (bug encontrado em auditoria —
 * sem isso `pendingCount`, em useOfflineSync.ts, ficava travado num número
 * que nunca mais chegava a zero, mesmo com o aparelho já sincronizado):
 *
 * 1. `23505` (unique_violation) no `id` — o `id` é gerado no client com
 *    crypto.randomUUID() só pra esta mutação (ver useAparelhos.ts), então
 *    essa violação só pode significar que uma tentativa anterior já inseriu
 *    esta linha com sucesso, mas o app fechou/travou antes de
 *    `removeMutation` rodar. Trata como sucesso.
 * 2. `23503` (foreign_key_violation) — `categoria_id`/`fornecedor_id`
 *    apontava pra uma linha apagada enquanto o aparelho ainda só existia na
 *    fila local (offline). `on delete restrict`/`on delete set null`
 *    (migrations 0011/0017) só protegem linhas que já existiam no banco no
 *    momento do delete — não tem como o Postgres saber de uma mutação
 *    enfileirada no IndexedDB de um dispositivo que estava offline. Sem
 *    isso, a categoria/fornecedor apagado (que nunca vai "voltar") deixava a
 *    mutação presa pra sempre. Tenta de novo uma vez sem as referências,
 *    preservando o cadastro do aparelho em si (IMEI, custo etc.).
 */
async function sincronizarCriarAparelho(mutation: PendingCriarAparelho): Promise<boolean> {
  const { error } = await supabase.from('aparelhos').insert({ id: mutation.id, ...mutation.input })
  if (!error) return true
  if (error.code === '23505') return true

  if (error.code === '23503') {
    const { error: erroSemReferencias } = await supabase
      .from('aparelhos')
      .insert({ id: mutation.id, ...mutation.input, categoria_id: null, fornecedor_id: null })
    if (!erroSemReferencias || erroSemReferencias.code === '23505') return true
    console.warn(
      `Não consegui sincronizar ação pendente (criar_aparelho, id ${mutation.id}) mesmo sem categoria/fornecedor: ${erroSemReferencias.message}`,
    )
    return false
  }

  // Mantém na fila e tenta de novo na próxima sincronização — mas não trava
  // as demais ações pendentes por causa de uma só (ex.: rede caiu no meio).
  console.warn(`Não consegui sincronizar ação pendente (criar_aparelho, id ${mutation.id}): ${error.message}`)
  return false
}

/** Reenvia as ações pendentes ao Supabase, na ordem em que foram criadas. */
export async function flushOutbox(): Promise<void> {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const pending = await listPendingMutations()
    for (const mutation of pending) {
      const sincronizado = await sincronizarCriarAparelho(mutation)
      if (sincronizado) await removeMutation(mutation.id)
    }
  } finally {
    flushing = false
  }
}
