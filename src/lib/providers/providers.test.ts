import { describe, expect, it } from 'vitest'
import { PROVIDERS_INFO, providers } from './index'

describe('stubs de providers externos', () => {
  it('emitirNotaFiscal retorna não configurado', async () => {
    const resultado = await providers.fiscal.emitirNotaFiscal({
      vendaId: 'v1',
      clienteNome: 'Cliente',
      clienteCpfCnpj: null,
      itens: [],
      valorTotal: 100,
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.dados).toBeNull()
    expect(resultado.erro).toMatch(/não está configurad/i)
  })

  it('cancelarNotaFiscal e consultarStatus também retornam não configurado', async () => {
    const cancelamento = await providers.fiscal.cancelarNotaFiscal('chave', 'motivo')
    const status = await providers.fiscal.consultarStatus('chave')
    expect(cancelamento.ok).toBe(false)
    expect(status.ok).toBe(false)
  })

  it('consultarCpf retorna não configurado', async () => {
    const resultado = await providers.bureauCpf.consultarCpf('12345678900')
    expect(resultado.ok).toBe(false)
    expect(resultado.erro).toMatch(/não está configurad/i)
  })

  it('verificarImei retorna não configurado', async () => {
    const resultado = await providers.imeiRestricao.verificarImei('352562041506190')
    expect(resultado.ok).toBe(false)
    expect(resultado.erro).toMatch(/não está configurad/i)
  })

  it('importarExtrato retorna não configurado', async () => {
    const resultado = await providers.conciliacaoBancaria.importarExtrato({
      contaBancaria: 'conta-1',
      periodoInicio: '2026-01-01',
      periodoFim: '2026-01-31',
    })
    expect(resultado.ok).toBe(false)
    expect(resultado.erro).toMatch(/não está configurad/i)
  })

  it('simularFinanciamento e enviarProposta retornam não configurado', async () => {
    const input = { valorTotal: 1000, entrada: 200, cpfCliente: '12345678900', parcelasDesejadas: 12 }
    const simulacao = await providers.financiadora.simularFinanciamento(input)
    const envio = await providers.financiadora.enviarProposta({ ...input, financiadoraEscolhida: 'X' })
    expect(simulacao.ok).toBe(false)
    expect(envio.ok).toBe(false)
  })

  it('enviarMensagem e enviarNotificacaoVenda retornam não configurado', async () => {
    const mensagem = await providers.whatsApp.enviarMensagem({ telefone: '11999998888', mensagem: 'Oi' })
    const notificacao = await providers.whatsApp.enviarNotificacaoVenda({
      telefone: '11999998888',
      clienteNome: 'Cliente',
      valorTotal: 100,
    })
    expect(mensagem.ok).toBe(false)
    expect(notificacao.ok).toBe(false)
  })

  it('PROVIDERS_INFO documenta os 6 providers esperados', () => {
    expect(PROVIDERS_INFO).toHaveLength(6)
    expect(PROVIDERS_INFO.map((p) => p.chave).sort()).toEqual(
      ['bureauCpf', 'conciliacaoBancaria', 'financiadora', 'fiscal', 'imeiRestricao', 'whatsApp'].sort(),
    )
  })
})
