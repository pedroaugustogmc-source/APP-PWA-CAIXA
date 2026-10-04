import { naoConfigurado, type ResultadoProvider } from './types'

export interface EnviarMensagemInput {
  telefone: string
  mensagem: string
}

export interface NotificacaoVendaInput {
  telefone: string
  clienteNome: string
  valorTotal: number
}

/** Envio de mensagens (confirmação de venda, cobrança, lembrete) via WhatsApp Business API. */
export interface WhatsAppApiProvider {
  enviarMensagem(input: EnviarMensagemInput): Promise<ResultadoProvider<{ idMensagem: string }>>
  enviarNotificacaoVenda(input: NotificacaoVendaInput): Promise<ResultadoProvider<{ idMensagem: string }>>
}

export const stubWhatsAppApiProvider: WhatsAppApiProvider = {
  async enviarMensagem() {
    return naoConfigurado('WhatsApp')
  },
  async enviarNotificacaoVenda() {
    return naoConfigurado('WhatsApp')
  },
}
