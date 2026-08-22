import { supabase } from './supabase'
import type { ItemInput, VendaInput } from '../hooks/useItens'
import type { Categoria, Fornecedor, Plataforma } from '../types/domain'

/**
 * Fila de ações feitas sem conexão. Guardada no IndexedDB do navegador (some
 * se o usuário limpar dados do site, mas sobrevive a fechar/reabrir o app).
 * Só cobre as duas ações mais prováveis de acontecer sem sinal: cadastrar um
 * item e registrar uma venda — o resto exige conexão, como já era offline-só-leitura.
 */
export interface PendingCriarItem {
  kind: 'criar_item'
  id: string
  createdAt: string
  input: ItemInput
  categoriaSnapshot: Categoria | null
  fornecedorSnapshot: Fornecedor | null
}

export interface PendingVenda {
  kind: 'registrar_venda'
  id: string
  createdAt: string
  itemId: string
  input: VendaInput
  plataformaSnapshot: Plataforma
}

export type PendingMutation = PendingCriarItem | PendingVenda

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
      const { error } =
        mutation.kind === 'criar_item'
          ? await supabase.from('itens').insert({ id: mutation.id, ...mutation.input })
          : await supabase
              .from('itens')
              .update({ status: 'vendido', ...mutation.input })
              .eq('id', mutation.itemId)

      if (error) break // provável falha de rede — mantém a fila e tenta de novo depois
      await removeMutation(mutation.id)
    }
  } finally {
    flushing = false
  }
}
