import { describe, expect, it } from 'vitest'
import {
  TEMPLATE_CSV_APARELHOS,
  TEMPLATE_CSV_CLIENTES,
  parseCsv,
  validarAparelhos,
  validarClientes,
  validarLinhaAparelho,
  validarLinhaCliente,
} from './csvImport'

const LINHA_APARELHO_OK = {
  nome: 'iPhone 13 128GB',
  modelo: 'iPhone 13',
  cor: 'Preto',
  capacidade_gb: '128',
  bateria_saude: '92',
  imei: '352562041506190',
  imei2: '',
  condicao: 'seminovo',
  data_compra: '2026-01-15',
  custo_compra: '2200.00',
  preco_sugerido: '2999.90',
  observacoes: 'Nota',
}

describe('parseCsv', () => {
  it('lê cabeçalho e linhas, normalizando cabeçalho pra minúsculo', () => {
    const { headers, linhas } = parseCsv('Nome,Modelo\niPhone 13,iPhone 13\n')
    expect(headers).toEqual(['nome', 'modelo'])
    expect(linhas).toEqual([{ nome: 'iPhone 13', modelo: 'iPhone 13' }])
  })

  it('lida com campos entre aspas contendo vírgula', () => {
    const { linhas } = parseCsv('nome,observacoes\n"iPhone 13","Comprado em 2026, direto do cliente"\n')
    expect(linhas[0]?.observacoes).toBe('Comprado em 2026, direto do cliente')
  })

  it('ignora linhas vazias', () => {
    const { linhas } = parseCsv('nome,modelo\niPhone 13,iPhone 13\n\n')
    expect(linhas).toHaveLength(1)
  })
})

describe('validarLinhaAparelho', () => {
  it('aceita uma linha válida completa', () => {
    const resultado = validarLinhaAparelho(LINHA_APARELHO_OK, 2)
    expect(resultado.erro).toBeUndefined()
    expect(resultado.dados).toEqual({
      nome: 'iPhone 13 128GB',
      categoria_id: null,
      fornecedor_id: null,
      identificador: null,
      modelo: 'iPhone 13',
      cor: 'Preto',
      capacidade_gb: 128,
      bateria_saude: 92,
      imei: '352562041506190',
      imei2: null,
      condicao: 'seminovo',
      data_compra: '2026-01-15',
      custo_compra: 2200,
      custos_extras: [],
      dias_planejados: null,
      observacoes: 'Nota',
      preco_sugerido: 2999.9,
    })
  })

  it('aceita campos opcionais vazios, aplicando condição padrão seminovo', () => {
    const resultado = validarLinhaAparelho(
      { nome: 'X', modelo: 'Y', imei: '352562041506190', data_compra: '2026-01-01', custo_compra: '100' },
      2,
    )
    expect(resultado.erro).toBeUndefined()
    expect(resultado.dados?.condicao).toBe('seminovo')
    expect(resultado.dados?.cor).toBeNull()
    expect(resultado.dados?.capacidade_gb).toBeNull()
    expect(resultado.dados?.preco_sugerido).toBeNull()
  })

  it('rejeita linha sem nome', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, nome: '' }, 5)
    expect(resultado.linha).toBe(5)
    expect(resultado.erro).toMatch(/nome/i)
    expect(resultado.dados).toBeUndefined()
  })

  it('rejeita linha sem modelo', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, modelo: '' }, 2)
    expect(resultado.erro).toMatch(/modelo/i)
  })

  it('rejeita IMEI inválido (Luhn errado)', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, imei: '352562041506191' }, 2)
    expect(resultado.erro).toMatch(/imei/i)
  })

  it('rejeita IMEI com menos de 15 dígitos', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, imei: '123' }, 2)
    expect(resultado.erro).toMatch(/imei/i)
  })

  it('rejeita IMEI 2 inválido quando preenchido', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, imei2: '352562041506191' }, 2)
    expect(resultado.erro).toMatch(/imei 2/i)
  })

  it('rejeita data de compra em formato errado', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, data_compra: '15/01/2026' }, 2)
    expect(resultado.erro).toMatch(/data/i)
  })

  it('rejeita custo de compra não numérico', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, custo_compra: 'abc' }, 2)
    expect(resultado.erro).toMatch(/custo/i)
  })

  it('rejeita custo de compra negativo', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, custo_compra: '-10' }, 2)
    expect(resultado.erro).toMatch(/custo/i)
  })

  it('aceita custo de compra com vírgula decimal (planilha BR)', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, custo_compra: '2200,50' }, 2)
    expect(resultado.dados?.custo_compra).toBe(2200.5)
  })

  it('rejeita condição fora do enum', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, condicao: 'excelente' }, 2)
    expect(resultado.erro).toMatch(/condição/i)
  })

  it('rejeita bateria fora do intervalo 0-100', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, bateria_saude: '150' }, 2)
    expect(resultado.erro).toMatch(/bateria/i)
  })

  it('rejeita preço sugerido zero ou negativo quando preenchido', () => {
    const resultado = validarLinhaAparelho({ ...LINHA_APARELHO_OK, preco_sugerido: '0' }, 2)
    expect(resultado.erro).toMatch(/preço/i)
  })
})

describe('validarAparelhos', () => {
  it('numera as linhas a partir de 2 (linha 1 é o cabeçalho)', () => {
    const resultados = validarAparelhos([LINHA_APARELHO_OK, { ...LINHA_APARELHO_OK, nome: '' }])
    expect(resultados[0]?.linha).toBe(2)
    expect(resultados[1]?.linha).toBe(3)
  })

  it('marca a 2ª ocorrência de um IMEI repetido no arquivo como erro', () => {
    const resultados = validarAparelhos([LINHA_APARELHO_OK, { ...LINHA_APARELHO_OK, nome: 'Outro nome' }])
    expect(resultados[0]?.erro).toBeUndefined()
    expect(resultados[1]?.erro).toMatch(/imei duplicado/i)
    expect(resultados[1]?.erro).toMatch(/linha 2/)
  })

  it('não marca duplicidade entre duas linhas já inválidas por outro motivo', () => {
    const semImei = { ...LINHA_APARELHO_OK, imei: '' }
    const resultados = validarAparelhos([semImei, semImei])
    expect(resultados[0]?.erro).toMatch(/imei é obrigatório/i)
    expect(resultados[1]?.erro).toMatch(/imei é obrigatório/i)
  })
})

describe('validarLinhaCliente', () => {
  it('aceita uma linha válida completa', () => {
    const resultado = validarLinhaCliente(
      { nome: 'João da Silva', contato: '11999998888', cpf: '', email: 'joao@email.com', observacoes: 'VIP' },
      2,
    )
    expect(resultado.erro).toBeUndefined()
    expect(resultado.dados).toEqual({
      nome: 'João da Silva',
      contato: '11999998888',
      cpf: null,
      email: 'joao@email.com',
      observacoes: 'VIP',
    })
  })

  it('rejeita linha sem nome', () => {
    const resultado = validarLinhaCliente({ nome: '' }, 7)
    expect(resultado.linha).toBe(7)
    expect(resultado.erro).toMatch(/nome/i)
  })

  it('aceita todos os campos opcionais vazios', () => {
    const resultado = validarLinhaCliente({ nome: 'Maria' }, 2)
    expect(resultado.dados).toEqual({ nome: 'Maria', contato: null, cpf: null, email: null, observacoes: null })
  })
})

describe('validarClientes', () => {
  it('numera as linhas a partir de 2', () => {
    const resultados = validarClientes([{ nome: 'A' }, { nome: 'B' }])
    expect(resultados.map((r) => r.linha)).toEqual([2, 3])
  })
})

describe('templates CSV', () => {
  it('o template de aparelhos é válido segundo o próprio validador', () => {
    const { linhas } = parseCsv(TEMPLATE_CSV_APARELHOS)
    const resultados = validarAparelhos(linhas)
    expect(resultados.every((r) => r.erro === undefined)).toBe(true)
  })

  it('o template de clientes é válido segundo o próprio validador', () => {
    const { linhas } = parseCsv(TEMPLATE_CSV_CLIENTES)
    const resultados = validarClientes(linhas)
    expect(resultados.every((r) => r.erro === undefined)).toBe(true)
  })
})
