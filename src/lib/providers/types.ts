/**
 * Fase 5: stubs de providers externos. Nenhum destes integra com um serviço
 * real ainda — cada um é um ponto de extensão (interface + stub) pronto pra
 * receber uma implementação de verdade quando a loja contratar o serviço.
 *
 * Por que stub e não a integração real: todos exigem credencial/segredo de
 * terceiro (chave de API, certificado digital) que não pode viver no client
 * — este app é uma SPA que fala direto com o Supabase, sem backend próprio.
 * A implementação real de cada um nasce como uma Supabase Edge Function (que
 * guarda o segredo do lado do servidor) chamada no lugar do stub abaixo; a
 * interface pública não muda, só a classe que a implementa.
 */
export interface ResultadoProvider<T> {
  ok: boolean
  dados: T | null
  erro: string | null
}

export function naoConfigurado<T>(nomeProvider: string): ResultadoProvider<T> {
  return {
    ok: false,
    dados: null,
    erro: `${nomeProvider} ainda não está configurado nesta loja — é uma integração paga com terceiros, fale com o suporte PHONEITZ para habilitar.`,
  }
}
