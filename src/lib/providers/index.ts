export * from './types'
export * from './fiscalProvider'
export * from './bureauCpfProvider'
export * from './imeiRestricaoProvider'
export * from './conciliacaoBancariaProvider'
export * from './financiadoraProvider'
export * from './whatsAppApiProvider'

import { stubFiscalProvider } from './fiscalProvider'
import { stubBureauCpfProvider } from './bureauCpfProvider'
import { stubImeiRestricaoProvider } from './imeiRestricaoProvider'
import { stubConciliacaoBancariaProvider } from './conciliacaoBancariaProvider'
import { stubFinanciadoraProvider } from './financiadoraProvider'
import { stubWhatsAppApiProvider } from './whatsAppApiProvider'

/** Instâncias ativas hoje — todas stub. Trocar aqui por uma implementação real é o único ponto de mudança quando a loja contratar um desses serviços. */
export const providers = {
  fiscal: stubFiscalProvider,
  bureauCpf: stubBureauCpfProvider,
  imeiRestricao: stubImeiRestricaoProvider,
  conciliacaoBancaria: stubConciliacaoBancariaProvider,
  financiadora: stubFinanciadoraProvider,
  whatsApp: stubWhatsAppApiProvider,
}

export interface ProviderInfo {
  chave: keyof typeof providers
  nome: string
  descricao: string
}

/** Metadados pra exibir o status das integrações em Ajustes — não é config real, é só documentação do que existe como ponto de extensão. */
export const PROVIDERS_INFO: ProviderInfo[] = [
  { chave: 'fiscal', nome: 'Emissão de nota fiscal', descricao: 'Emite NFe/NFCe automaticamente ao concluir uma venda.' },
  { chave: 'bureauCpf', nome: 'Consulta de CPF', descricao: 'Verifica situação cadastral e restrições antes de aprovar financiamento ou venda fiado.' },
  { chave: 'imeiRestricao', nome: 'Restrição de IMEI', descricao: 'Checa se um aparelho de trade-in está bloqueado ou com restrição de roubo/furto.' },
  { chave: 'conciliacaoBancaria', nome: 'Conciliação bancária', descricao: 'Importa o extrato do banco e cruza automaticamente com contas a pagar/receber.' },
  { chave: 'financiadora', nome: 'Financiamento', descricao: 'Simula e envia propostas de financiamento pro cliente na hora da venda.' },
  { chave: 'whatsApp', nome: 'WhatsApp', descricao: 'Envia confirmação de venda, cobrança e lembretes direto pro cliente.' },
]
