// Gerado a partir do schema real no Supabase (mcp__Supabase__generate_typescript_types),
// filtrado apenas para as tabelas do Catira Control. O projeto Supabase é compartilhado
// com outro app do usuário; as tabelas dele não entram aqui.
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
      configuracoes: {
        Row: {
          created_at: string
          dias_estoque_parado_alerta: number
          id: string
          margem_alvo_pct: number
          meta_mensal_lucro: number
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dias_estoque_parado_alerta?: number
          id?: string
          margem_alvo_pct?: number
          meta_mensal_lucro?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          created_at?: string
          dias_estoque_parado_alerta?: number
          id?: string
          margem_alvo_pct?: number
          meta_mensal_lucro?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      despesas_gerais: {
        Row: {
          categoria_despesa: Database['public']['Enums']['categoria_despesa_tipo']
          created_at: string
          data: string
          descricao: string | null
          id: string
          updated_at: string
          user_id: string
          valor: number
        }
        Insert: {
          categoria_despesa: Database['public']['Enums']['categoria_despesa_tipo']
          created_at?: string
          data: string
          descricao?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          valor: number
        }
        Update: {
          categoria_despesa?: Database['public']['Enums']['categoria_despesa_tipo']
          created_at?: string
          data?: string
          descricao?: string | null
          id?: string
          updated_at?: string
          user_id?: string
          valor?: number
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
      itens: {
        Row: {
          condicao: Database['public']['Enums']['condicao_item']
          created_at: string
          data_venda: string | null
          id: string
          identificador: string | null
          lote_id: string
          observacoes: string | null
          plataforma_id: string | null
          preco_venda: number | null
          status: Database['public']['Enums']['status_item']
          taxa_plataforma_pct: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          condicao?: Database['public']['Enums']['condicao_item']
          created_at?: string
          data_venda?: string | null
          id?: string
          identificador?: string | null
          lote_id: string
          observacoes?: string | null
          plataforma_id?: string | null
          preco_venda?: number | null
          status?: Database['public']['Enums']['status_item']
          taxa_plataforma_pct?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          condicao?: Database['public']['Enums']['condicao_item']
          created_at?: string
          data_venda?: string | null
          id?: string
          identificador?: string | null
          lote_id?: string
          observacoes?: string | null
          plataforma_id?: string | null
          preco_venda?: number | null
          status?: Database['public']['Enums']['status_item']
          taxa_plataforma_pct?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'itens_lote_id_fkey'
            columns: ['lote_id']
            isOneToOne: false
            referencedRelation: 'lotes_compra'
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
      lotes_compra: {
        Row: {
          categoria_id: string | null
          cotacao_dolar: number | null
          created_at: string
          custo_extra: number
          custo_frete: number
          custo_produto: number
          data_compra: string
          fornecedor_id: string | null
          id: string
          observacoes: string | null
          quantidade_comprada: number
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          cotacao_dolar?: number | null
          created_at?: string
          custo_extra?: number
          custo_frete?: number
          custo_produto?: number
          data_compra: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          quantidade_comprada: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          categoria_id?: string | null
          cotacao_dolar?: number | null
          created_at?: string
          custo_extra?: number
          custo_frete?: number
          custo_produto?: number
          data_compra?: string
          fornecedor_id?: string | null
          id?: string
          observacoes?: string | null
          quantidade_comprada?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: 'lotes_compra_categoria_id_fkey'
            columns: ['categoria_id']
            isOneToOne: false
            referencedRelation: 'categorias'
            referencedColumns: ['id']
          },
          {
            foreignKeyName: 'lotes_compra_fornecedor_id_fkey'
            columns: ['fornecedor_id']
            isOneToOne: false
            referencedRelation: 'fornecedores'
            referencedColumns: ['id']
          },
        ]
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
    }
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: {
      categoria_despesa_tipo: 'marketing' | 'embalagem_geral' | 'transporte' | 'taxas' | 'outros'
      condicao_item: 'novo' | 'usado'
      status_item: 'em_estoque' | 'reservado' | 'vendido' | 'perdido_danificado'
    }
    CompositeTypes: Record<string, never>
  }
}
