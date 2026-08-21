import { describe, expect, it } from 'vitest'
import { toCsv } from './csv'

describe('toCsv', () => {
  it('monta cabeçalho e linhas separados por ";"', () => {
    const rows = [{ nome: 'Capa', valor: 45 }]
    const csv = toCsv(rows, [
      { key: 'nome', label: 'Nome', value: (r) => r.nome },
      { key: 'valor', label: 'Valor', value: (r) => r.valor },
    ])
    expect(csv).toBe('Nome;Valor\nCapa;45')
  })

  it('coloca entre aspas e escapa valores com ";", aspas ou quebra de linha', () => {
    const rows = [{ obs: 'contém; ponto e vírgula' }, { obs: 'aspas "duplas"' }]
    const csv = toCsv(rows, [{ key: 'obs', label: 'Obs', value: (r) => r.obs }])
    expect(csv).toBe('Obs\n"contém; ponto e vírgula"\n"aspas ""duplas"""')
  })

  it('trata valor nulo como célula vazia', () => {
    const rows = [{ campo: null as string | null }]
    const csv = toCsv(rows, [{ key: 'campo', label: 'Campo', value: (r) => r.campo }])
    expect(csv).toBe('Campo\n')
  })
})
