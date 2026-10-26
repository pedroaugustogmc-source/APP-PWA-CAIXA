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

// Excluir um registro referenciado em outra tabela (ex.: aparelho que já
// entrou numa venda ou foi recebido como trade-in) é bloqueado pela
// foreign key, SQLSTATE 23503 — esperado e comum o bastante pra merecer
// mensagem própria, não o fallback genérico.
const FALLBACK_EXCLUSAO = 'Não foi possível excluir. Tente novamente em instantes.'

export function mensagemErroExclusao(error: { message: string; code?: string } | null | undefined): string | null {
  if (!error) return null
  if (error.code === '23503') {
    return 'Não dá pra excluir: esse registro está vinculado a outro (uma venda, conta ou troca, por exemplo). Remova o vínculo primeiro.'
  }
  return FALLBACK_EXCLUSAO
}

// supabase-js nunca traduz os erros do Auth (GoTrue) — vêm sempre em inglês,
// direto da API. error.code é o identificador estável (ver
// https://supabase.com/docs/guides/auth/debugging/error-codes); a mensagem
// em si pode mudar entre versões, então nunca é usada pra decidir o texto.
const MENSAGENS_AUTH: Record<string, string> = {
  invalid_credentials: 'E-mail ou senha incorretos.',
  email_not_confirmed: 'Confirme seu e-mail antes de entrar — veja sua caixa de entrada.',
  user_already_exists: 'Já existe uma conta com esse e-mail. Tente entrar em vez de criar uma nova.',
  user_not_found: 'Não encontramos uma conta com esse e-mail.',
  weak_password: 'Senha muito fraca. Use pelo menos 6 caracteres.',
  same_password: 'A nova senha precisa ser diferente da atual.',
  email_address_invalid: 'Esse e-mail não é válido.',
  email_exists: 'Já existe uma conta com esse e-mail. Tente entrar em vez de criar uma nova.',
  validation_failed: 'Confira os dados preenchidos e tente de novo.',
  over_request_rate_limit: 'Muitas tentativas seguidas. Aguarde um instante e tente de novo.',
  over_email_send_rate_limit: 'Muitas tentativas seguidas. Aguarde um instante e tente de novo.',
  signup_disabled: 'Criação de contas está temporariamente desativada.',
}

const FALLBACK_AUTH = 'Não foi possível concluir. Verifique os dados e tente de novo.'

export function mensagemErroAuth(error: { message: string; code?: string } | null | undefined): string | null {
  if (!error) return null
  const traduzida = error.code ? MENSAGENS_AUTH[error.code] : undefined
  if (traduzida) return traduzida
  return FALLBACK_AUTH
}
