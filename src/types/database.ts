import type { CondicaoItem, CustoExtra, StatusItem } from './domain'

// Alinhado com /supabase/migrations. O projeto Supabase é compartilhado com
// outro app do usuário; as tabelas dele não entram aqui.
export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[]

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: {
          created_at: string
          id: string
          nome: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      fornecedores: {
        Row: {
          contato: string | null
          created_at: string
          id: string
          nome: string
          observacoes: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          contato?: string | null
          created_at?: string
          id?: string
          nome: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          contato?: string | null
          created_at?: string
          id?: string
          nome?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      plataformas: {
        Row: {
          created_at: string
          id: string
          nome: string
          taxa_padrao_pct: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          nome: string
          taxa_padrao_pct?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          id?: string
          nome?: string
          taxa_padrao_pct?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      configuracoes: {
        Row: {
          created_at: string
          dias_estoque_parado_alerta: number
          id: string
          meta_mensal_lucro: number
          meta_semanal_lucro: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_estoque_parado_alerta?: number
          id?: string
          meta_mensal_lucro?: number
          meta_semanal_lucro?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          dias_estoque_parado_alerta?: number
          id?: string
          meta_mensal_lucro?: number
          meta_semanal_lucro?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      itens: {
        Row: {
          id: string
          user_id: string
          nome: string
          categoria_id: string | null
          fornecedor_id: string | null
          identificador: string | null
          condicao: CondicaoItem
          status: StatusItem
          data_compra: string
          custo_compra: number
          custos_extras: CustoExtra[]
          dias_planejados: number | null
          data_venda: string | null
          preco_venda: number | null
          plataforma_id: string | null
          taxa_plataforma_pct: number | null
          observacoes: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          user_id?: string
          nome: string
          categoria_id?: string | null
          fornecedor_id?: string | null
          identificador?: string | null
          condicao?: CondicaoItem
          status?: StatusItem
          data_compra: string
          custo_compra?: number
          custos_extras?: CustoExtra[]
          dias_planejados?: number | null
          data_venda?: string | null
          preco_venda?: number | null
          plataforma_id?: string | null
          taxa_plataforma_pct?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          user_id?: string
          nome?: string
          categoria_id?: string | null
          fornecedor_id?: string | null
          identificador?: string | null
          condicao?: CondicaoItem
          status?: StatusItem
          data_compra?: string
          custo_compra?: number
          custos_extras?: CustoExtra[]
          dias_planejados?: number | null
          data_venda?: string | null
          preco_venda?: number | null
          plataforma_id?: string | null
          taxa_plataforma_pct?: number | null
          observacoes?: string | null
          created_at?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: 'itens_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'itens_fornecedor_id_fkey'
            columns: ['fornecedor_id']
            isOneToOne: false
            referencedRelation: 'fornecedores'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'itens_plataforma_id_fkey'
            columns: ['plataforma_id']
            isOneToOne: false
            referencedRelation: 'plataformas'
            referencedColumns: ['id']
          },
        ]
      }
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      condicao_item: CondicaoItem
      status_item: StatusItem
    }
    CompositeTypes: Record<string, never>
  }
}
