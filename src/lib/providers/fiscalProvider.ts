import { naoConfigurado, type ResultadoProvider } from './types'

export interface ItemNotaFiscal {
  descricao: string
  quantidade: number
  valorUnitario: number
}

export interface EmitirNotaFiscalInput {
  vendaId: string
  clienteNome: string
  clienteCpfCnpj: string | null
  itens: ItemNotaFiscal[]
  valorTotal: number
}

export interface NotaFiscalEmitida {
  numeroNota: string
  chaveAcesso: string
  urlDanfe: string
  urlXml: string
}

export interface StatusNotaFiscal {
  status: 'autorizada' | 'cancelada' | 'rejeitada'
  motivo: string | null
}

/** Emissão de NFe/NFCe pra vendas — integração futura com um emissor fiscal (ex.: Focus NFe, eNotas). */
export interface FiscalProvider {
  emitirNotaFiscal(input: EmitirNotaFiscalInput): Promise<ResultadoProvider<NotaFiscalEmitida>>
  cancelarNotaFiscal(chaveAcesso: string, motivo: string): Promise<ResultadoProvider<void>>
  consultarStatus(chaveAcesso: string): Promise<ResultadoProvider<StatusNotaFiscal>>
}

export const stubFiscalProvider: FiscalProvider = {
  async emitirNotaFiscal() {
    return naoConfigurado('Emissão de nota fiscal')
  },
  async cancelarNotaFiscal() {
    return naoConfigurado('Emissão de nota fiscal')
  },
  async consultarStatus() {
    return naoConfigurado('Emissão de nota fiscal')
  },
}
