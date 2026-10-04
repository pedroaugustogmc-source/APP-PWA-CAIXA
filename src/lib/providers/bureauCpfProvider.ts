import { naoConfigurado, type ResultadoProvider } from './types'

export interface ConsultaCpfResultado {
  cpf: string
  nome: string | null
  situacaoCadastral: 'regular' | 'irregular' | 'suspensa' | 'desconhecida'
  possuiRestricao: boolean
  scoreCredito: number | null
}

/** Consulta de CPF/situação cadastral — útil antes de aprovar financiamento ou venda fiado. */
export interface BureauCpfProvider {
  consultarCpf(cpf: string): Promise<ResultadoProvider<ConsultaCpfResultado>>
}

export const stubBureauCpfProvider: BureauCpfProvider = {
  async consultarCpf() {
    return naoConfigurado('Consulta de CPF')
  },
}
