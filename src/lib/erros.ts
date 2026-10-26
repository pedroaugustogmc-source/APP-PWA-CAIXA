// RPCs deste app sinalizam falha esperada com `raise exception '<mensagem em
// pt-BR>'` dentro da função (ver supabase/migrations/0019, 0025, 0036) — o
// Postgres marca isso com o SQLSTATE genérico P0001, e é seguro mostrar essa
// mensagem direto pro usuário. Qualquer outro código (função não encontrada,
// permissão, timeout, erro de rede, etc.) é falha de infraestrutura — nunca
// deveria virar texto técnico na tela de quem usa a loja.
const FALLBACK = 'Não foi possível concluir a operação. Tente novamente em instantes.'

export function mensagemErroAmigavel(error: { message: string; code?: string } | null | undefined): string | null {
  if (!error) return null
  if (error.code === 'P0001') return error.message
  return FALLBACK
}
