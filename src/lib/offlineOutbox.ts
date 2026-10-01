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

/** Reenvia as ações pendentes ao Supabase, na ordem em que foram criadas. */
export async function flushOutbox(): Promise<void> {
  if (flushing || !navigator.onLine) return
  flushing = true
  try {
    const pending = await listPendingMutations()
    for (const mutation of pending) {
      const { error } = await supabase.from('aparelhos').insert({ id: mutation.id, ...mutation.input })

      if (error) {
        // Mantém na fila e tenta de novo na próxima sincronização — mas não
        // trava as demais ações pendentes por causa de uma só (ex.: rede caiu
        // no meio, ou a ação referencia algo apagado enquanto estava offline).
        console.warn(`Não consegui sincronizar ação pendente (${mutation.kind}, id ${mutation.id}): ${error.message}`)
        continue
      }
      await removeMutation(mutation.id)
    }
  } finally {
    flushing = false
  }
}
