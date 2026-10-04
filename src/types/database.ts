// Gerado via mcp__Supabase__generate_typescript_types e recortado manualmente
// para as tabelas/funções/enums do PHONEITZ. O projeto Supabase é
// compartilhado com outro app do usuário (gestão de fazenda); as tabelas e
// funções dele não entram aqui.
export interface CustoExtra {
  label: string
  valor: number
}

export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      lojas: {
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
          nome?: string
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
      configuracoes: {
        Row: {
          comissao_vendedor_pct_padrao: number
          created_at: string
          dias_estoque_parado_alerta: number
          id: string
          margem_alvo_pct: number
          meta_mensal_lucro: number
          meta_semanal_lucro: number
          updated_at: string
          user_id: string
        }
        Insert: {
          comissao_vendedor_pct_padrao?: number
          created_at?: string
          dias_estoque_parado_alerta?: number
          id?: string
          margem_alvo_pct?: number
          meta_mensal_lucro?: number
          meta_semanal_lucro?: number
          updated_at?: string
          user_id?: string
        }
        Update: {
          comissao_vendedor_pct_padrao?: number
          created_at?: string
          dias_estoque_parado_alerta?: number
          id?: string
          margem_alvo_pct?: number
          meta_mensal_lucro?: number
          meta_semanal_lucro?: number
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
      aparelhos: {
        Row: {
          bateria_saude: number | null
          capacidade_gb: number | null
          categoria_id: string | null
          condicao: Database["public"]["Enums"]["condicao_aparelho"]
          condicao_antiga: "novo" | "usado"
          cor: string | null
          created_at: string
          custo_compra: number
          custos_extras: CustoExtra[]
          data_compra: string
          data_venda_antiga: string | null
          dias_planejados: number | null
          fornecedor_id: string | null
          id: string
          identificador: string | null
          imei: string | null
          imei2: string | null
          loja_id: string
          modelo: string
          nome: string
          observacoes: string | null
          plataforma_id_antigo: string | null
          preco_venda_antigo: number | null
          status: Database["public"]["Enums"]["status_aparelho"]
          status_antigo: "em_estoque" | "reservado" | "vendido" | "perdido_danificado"
          taxa_plataforma_pct_antiga: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          bateria_saude?: number | null
          capacidade_gb?: number | null
          categoria_id?: string | null
          condicao?: Database["public"]["Enums"]["condicao_aparelho"]
          condicao_antiga?: "novo" | "usado"
          cor?: string | null
          created_at?: string
          custo_compra?: number
          custos_extras?: CustoExtra[]
          data_compra: string
          data_venda_antiga?: string | null
          dias_planejados?: number | null
          fornecedor_id?: string | null
          id?: string
          identificador?: string | null
          imei?: string | null
          imei2?: string | null
          loja_id?: string
          modelo?: string
          nome: string
          observacoes?: string | null
          plataforma_id_antigo?: string | null
          preco_venda_antigo?: number | null
          status?: Database["public"]["Enums"]["status_aparelho"]
          status_antigo?: "em_estoque" | "reservado" | "vendido" | "perdido_danificado"
          taxa_plataforma_pct_antiga?: number | null
          updated_at?: string
          user_id?: string
        }
        Update: {
          bateria_saude?: number | null
          capacidade_gb?: number | null
          categoria_id?: string | null
          condicao?: Database["public"]["Enums"]["condicao_aparelho"]
          condicao_antiga?: "novo" | "usado"
          cor?: string | null
          created_at?: string
          custo_compra?: number
          custos_extras?: CustoExtra[]
          data_compra?: string
          data_venda_antiga?: string | null
          dias_planejados?: number | null
          fornecedor_id?: string | null
          id?: string
          identificador?: string | null
          imei?: string | null
          imei2?: string | null
          loja_id?: string
          modelo?: string
          nome?: string
          observacoes?: string | null
          plataforma_id_antigo?: string | null
          preco_venda_antigo?: number | null
          status?: Database["public"]["Enums"]["status_aparelho"]
          status_antigo?: "em_estoque" | "reservado" | "vendido" | "perdido_danificado"
          taxa_plataforma_pct_antiga?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aparelhos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "itens_plataforma_id_fkey"
            columns: ["plataforma_id_antigo"]
            isOneToOne: false
            referencedRelation: "plataformas"
            referencedColumns: ["id"]
          },
        ]
      }
      aparelho_eventos: {
        Row: {
          aparelho_id: string
          created_at: string
          id: string
          loja_id: string
          metadata: Json
          motivo: string | null
          status_anterior: Database["public"]["Enums"]["status_aparelho"] | null
          status_novo: Database["public"]["Enums"]["status_aparelho"]
          user_id: string
        }
        Insert: {
          aparelho_id: string
          created_at?: string
          id?: string
          loja_id: string
          metadata?: Json
          motivo?: string | null
          status_anterior?:
            | Database["public"]["Enums"]["status_aparelho"]
            | null
          status_novo: Database["public"]["Enums"]["status_aparelho"]
          user_id?: string
        }
        Update: {
          aparelho_id?: string
          created_at?: string
          id?: string
          loja_id?: string
          metadata?: Json
          motivo?: string | null
          status_anterior?:
            | Database["public"]["Enums"]["status_aparelho"]
            | null
          status_novo?: Database["public"]["Enums"]["status_aparelho"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "aparelho_eventos_aparelho_id_fkey"
            columns: ["aparelho_id"]
            isOneToOne: false
            referencedRelation: "aparelhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "aparelho_eventos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      acessorios: {
        Row: {
          categoria_id: string | null
          created_at: string
          custo_unitario: number
          estoque_minimo: number
          fornecedor_id: string | null
          id: string
          loja_id: string
          nome: string
          observacoes: string | null
          preco_venda: number
          quantidade_estoque: number
          sku: string
          updated_at: string
          user_id: string
        }
        Insert: {
          categoria_id?: string | null
          created_at?: string
          custo_unitario?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          loja_id?: string
          nome: string
          observacoes?: string | null
          preco_venda?: number
          quantidade_estoque?: number
          sku: string
          updated_at?: string
          user_id?: string
        }
        Update: {
          categoria_id?: string | null
          created_at?: string
          custo_unitario?: number
          estoque_minimo?: number
          fornecedor_id?: string | null
          id?: string
          loja_id?: string
          nome?: string
          observacoes?: string | null
          preco_venda?: number
          quantidade_estoque?: number
          sku?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "acessorios_categoria_id_fkey"
            columns: ["categoria_id"]
            isOneToOne: false
            referencedRelation: "categorias"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acessorios_fornecedor_id_fkey"
            columns: ["fornecedor_id"]
            isOneToOne: false
            referencedRelation: "fornecedores"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "acessorios_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      vendas: {
        Row: {
          cliente_contato: string | null
          cliente_nome: string | null
          comissao_vendedor_pct: number | null
          comissao_vendedor_valor: number
          created_at: string
          data_venda: string
          id: string
          loja_id: string
          observacoes: string | null
          status: Database["public"]["Enums"]["status_venda"]
          updated_at: string
          user_id: string
          vendedor_user_id: string
        }
        Insert: {
          cliente_contato?: string | null
          cliente_nome?: string | null
          comissao_vendedor_pct?: number | null
          comissao_vendedor_valor?: number
          created_at?: string
          data_venda?: string
          id?: string
          loja_id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_venda"]
          updated_at?: string
          user_id?: string
          vendedor_user_id?: string
        }
        Update: {
          cliente_contato?: string | null
          cliente_nome?: string | null
          comissao_vendedor_pct?: number | null
          comissao_vendedor_valor?: number
          created_at?: string
          data_venda?: string
          id?: string
          loja_id?: string
          observacoes?: string | null
          status?: Database["public"]["Enums"]["status_venda"]
          updated_at?: string
          user_id?: string
          vendedor_user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "vendas_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_itens: {
        Row: {
          acessorio_id: string | null
          aparelho_id: string | null
          created_at: string
          custo_unitario_snapshot: number
          id: string
          loja_id: string
          preco_unitario: number
          quantidade: number
          user_id: string
          venda_id: string
        }
        Insert: {
          acessorio_id?: string | null
          aparelho_id?: string | null
          created_at?: string
          custo_unitario_snapshot: number
          id?: string
          loja_id?: string
          preco_unitario: number
          quantidade?: number
          user_id?: string
          venda_id: string
        }
        Update: {
          acessorio_id?: string | null
          aparelho_id?: string | null
          created_at?: string
          custo_unitario_snapshot?: number
          id?: string
          loja_id?: string
          preco_unitario?: number
          quantidade?: number
          user_id?: string
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_itens_acessorio_id_fkey"
            columns: ["acessorio_id"]
            isOneToOne: false
            referencedRelation: "acessorios"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_aparelho_id_fkey"
            columns: ["aparelho_id"]
            isOneToOne: false
            referencedRelation: "aparelhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_itens_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_pagamentos: {
        Row: {
          created_at: string
          forma: Database["public"]["Enums"]["forma_pagamento"]
          id: string
          loja_id: string
          parcelas: number
          taxa_pct: number
          taxa_valor: number
          user_id: string
          valor: number
          venda_id: string
        }
        Insert: {
          created_at?: string
          forma: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          loja_id?: string
          parcelas?: number
          taxa_pct?: number
          taxa_valor?: number
          user_id?: string
          valor: number
          venda_id: string
        }
        Update: {
          created_at?: string
          forma?: Database["public"]["Enums"]["forma_pagamento"]
          id?: string
          loja_id?: string
          parcelas?: number
          taxa_pct?: number
          taxa_valor?: number
          user_id?: string
          valor?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_pagamentos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_pagamentos_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: false
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      venda_trade_ins: {
        Row: {
          aparelho_recebido_id: string
          created_at: string
          id: string
          loja_id: string
          user_id: string
          valor_avaliacao: number
          venda_id: string
        }
        Insert: {
          aparelho_recebido_id: string
          created_at?: string
          id?: string
          loja_id?: string
          user_id?: string
          valor_avaliacao: number
          venda_id: string
        }
        Update: {
          aparelho_recebido_id?: string
          created_at?: string
          id?: string
          loja_id?: string
          user_id?: string
          valor_avaliacao?: number
          venda_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "venda_trade_ins_aparelho_recebido_id_fkey"
            columns: ["aparelho_recebido_id"]
            isOneToOne: false
            referencedRelation: "aparelhos"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_trade_ins_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "venda_trade_ins_venda_id_fkey"
            columns: ["venda_id"]
            isOneToOne: true
            referencedRelation: "vendas"
            referencedColumns: ["id"]
          },
        ]
      }
      depreciacao_modelos: {
        Row: {
          condicao: Database["public"]["Enums"]["condicao_aparelho"]
          created_at: string
          depreciacao_mensal_pct: number
          id: string
          loja_id: string
          modelo: string
          observacoes: string | null
          updated_at: string
          user_id: string
          valor_base: number
          vigente_desde: string
        }
        Insert: {
          condicao: Database["public"]["Enums"]["condicao_aparelho"]
          created_at?: string
          depreciacao_mensal_pct?: number
          id?: string
          loja_id?: string
          modelo: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
          valor_base: number
          vigente_desde?: string
        }
        Update: {
          condicao?: Database["public"]["Enums"]["condicao_aparelho"]
          created_at?: string
          depreciacao_mensal_pct?: number
          id?: string
          loja_id?: string
          modelo?: string
          observacoes?: string | null
          updated_at?: string
          user_id?: string
          valor_base?: number
          vigente_desde?: string
        }
        Relationships: [
          {
            foreignKeyName: "depreciacao_modelos_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      phoneitz_auditoria: {
        Row: {
          created_at: string
          dados_antes: Json | null
          dados_depois: Json | null
          id: string
          loja_id: string
          operacao: string
          registro_id: string
          tabela: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          loja_id: string
          operacao: string
          registro_id: string
          tabela: string
          user_id: string
        }
        Update: {
          created_at?: string
          dados_antes?: Json | null
          dados_depois?: Json | null
          id?: string
          loja_id?: string
          operacao?: string
          registro_id?: string
          tabela?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "phoneitz_auditoria_loja_id_fkey"
            columns: ["loja_id"]
            isOneToOne: false
            referencedRelation: "lojas"
            referencedColumns: ["id"]
          },
        ]
      }
      }
    Views: {
      }
    Functions: {
      phoneitz_garantir_loja: { Args: never; Returns: string }
      phoneitz_current_loja_id: { Args: never; Returns: string }
      phoneitz_luhn_valido: { Args: { p_numero: string }; Returns: boolean }
      phoneitz_concluir_venda: { Args: { p_venda: Json }; Returns: string }
      }
    Enums: {
      condicao_aparelho: "novo" | "seminovo" | "vitrine" | "defeito"
      status_aparelho:
        | "em_estoque"
        | "reservado"
        | "vendido"
        | "devolvido"
        | "baixado"
      forma_pagamento:
        | "dinheiro"
        | "pix"
        | "cartao_debito"
        | "cartao_credito"
        | "boleto"
        | "financiamento"
        | "outro"
      status_venda: "concluida" | "cancelada"
      }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends (DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never) = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends (DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never) = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends (PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never) = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      condicao_aparelho: ["novo", "seminovo", "vitrine", "defeito"],
      status_aparelho: [
        "em_estoque",
        "reservado",
        "vendido",
        "devolvido",
        "baixado",
      ],
      forma_pagamento: [
        "dinheiro",
        "pix",
        "cartao_debito",
        "cartao_credito",
        "boleto",
        "financiamento",
        "outro",
      ],
      status_venda: ["concluida", "cancelada"],
    }
  },
} as const
