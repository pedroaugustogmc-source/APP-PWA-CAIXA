import { naoConfigurado, type ResultadoProvider } from './types'

export interface ConsultaImeiResultado {
  imei: string
  bloqueado: boolean
  motivo: string | null
}

/** Checagem de IMEI roubado/bloqueado antes de aceitar um trade-in — reduz o risco de receber aparelho com restrição. */
export interface ImeiRestricaoProvider {
  verificarImei(imei: string): Promise<ResultadoProvider<ConsultaImeiResultado>>
}

export const stubImeiRestricaoProvider: ImeiRestricaoProvider = {
  async verificarImei() {
    return naoConfigurado('Consulta de restrição de IMEI')
  },
}
