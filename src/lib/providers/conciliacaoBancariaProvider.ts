import { naoConfigurado, type ResultadoProvider } from './types'

export interface LancamentoBancario {
  dataMovimento: string
  descricao: string
  valor: number
  tipo: 'credito' | 'debito'
  identificadorExterno: string
}

export interface ImportarExtratoInput {
  contaBancaria: string
  periodoInicio: string
  periodoFim: string
}

/** Importa o extrato do banco pra cruzar automaticamente com contas a pagar/receber. */
export interface ConciliacaoBancariaProvider {
  importarExtrato(input: ImportarExtratoInput): Promise<ResultadoProvider<LancamentoBancario[]>>
}

export const stubConciliacaoBancariaProvider: ConciliacaoBancariaProvider = {
  async importarExtrato() {
    return naoConfigurado('Conciliação bancária')
  },
}
