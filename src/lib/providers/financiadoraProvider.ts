import { naoConfigurado, type ResultadoProvider } from './types'

export interface SimularFinanciamentoInput {
  valorTotal: number
  entrada: number
  cpfCliente: string
  parcelasDesejadas: number
}

export interface PropostaFinanciamento {
  financiadora: string
  parcelas: number
  valorParcela: number
  taxaJurosMensal: number
  cet: number
}

export interface EnviarPropostaInput extends SimularFinanciamentoInput {
  financiadoraEscolhida: string
}

/** Simulação e envio de proposta de financiamento pro cliente na venda de um aparelho. */
export interface FinanciadoraProvider {
  simularFinanciamento(input: SimularFinanciamentoInput): Promise<ResultadoProvider<PropostaFinanciamento[]>>
  enviarProposta(input: EnviarPropostaInput): Promise<ResultadoProvider<{ protocolo: string }>>
}

export const stubFinanciadoraProvider: FinanciadoraProvider = {
  async simularFinanciamento() {
    return naoConfigurado('Financiamento')
  },
  async enviarProposta() {
    return naoConfigurado('Financiamento')
  },
}
