// Tipos do schema do banco, alinhados com /supabase/migrations.
// Estrutura completa (Tables/Views/Functions/Enums) é preenchida na Fase 2.
export type Database = {
  public: {
    Tables: Record<string, never>
    Views: Record<string, never>
    Functions: Record<string, never>
    Enums: Record<string, never>
    CompositeTypes: Record<string, never>
  }
}
