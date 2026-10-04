import Papa from 'papaparse'
import { imeiValido } from './luhn'
import type { AparelhoInput } from '../hooks/useAparelhos'
import type { ClienteInput } from '../hooks/useClientes'
import type { CondicaoAparelho } from '../types/domain'

export interface LinhaImportada<T> {
  /** Número da linha como o usuário vê numa planilha — linha 1 é o cabeçalho, então a 1ª linha de dado é 2. */
  linha: number
  dados?: T
  erro?: string
}

const CONDICOES_VALIDAS: CondicaoAparelho[] = ['novo', 'seminovo', 'vitrine', 'defeito']

export function parseCsv(texto: string): { headers: string[]; linhas: Record<string, string>[] } {
  const resultado = Papa.parse<Record<string, string>>(texto.trim(), {
    header: true,
    skipEmptyLines: true,
    transformHeader: (h) => h.trim().toLowerCase(),
  })
  return { headers: resultado.meta.fields ?? [], linhas: resultado.data }
}

function campo(row: Record<string, string>, chave: string): string {
  return (row[chave] ?? '').trim()
}

/** Aceita tanto "1234.56" quanto "1234,56" (CSV exportado de planilha BR). */
function numeroOuNulo(valor: string): number | null {
  if (!valor) return null
  const n = Number(valor.replace(',', '.'))
  return Number.isFinite(n) ? n : null
}

export function validarLinhaAparelho(row: Record<string, string>, linha: number): LinhaImportada<AparelhoInput> {
  const nome = campo(row, 'nome')
  if (!nome) return { linha, erro: 'Nome é obrigatório.' }

  const modelo = campo(row, 'modelo')
  if (!modelo) return { linha, erro: 'Modelo é obrigatório.' }

  const imei = campo(row, 'imei')
  if (!imei) return { linha, erro: 'IMEI é obrigatório.' }
  if (!imeiValido(imei)) return { linha, erro: 'IMEI inválido — precisa ter 15 dígitos com dígito verificador Luhn correto.' }

  const imei2 = campo(row, 'imei2')
  if (imei2 && !imeiValido(imei2)) return { linha, erro: 'IMEI 2 inválido.' }

  const dataCompra = campo(row, 'data_compra')
  if (!/^\d{4}-\d{2}-\d{2}$/.test(dataCompra)) return { linha, erro: 'Data de compra inválida — use o formato AAAA-MM-DD.' }

  const custoCompra = numeroOuNulo(campo(row, 'custo_compra'))
  if (custoCompra === null || custoCompra < 0) return { linha, erro: 'Custo de compra inválido.' }

  const condicaoTexto = (campo(row, 'condicao') || 'seminovo').toLowerCase()
  if (!CONDICOES_VALIDAS.includes(condicaoTexto as CondicaoAparelho)) {
    return { linha, erro: `Condição inválida — use um de: ${CONDICOES_VALIDAS.join(', ')}.` }
  }

  const capacidadeTexto = campo(row, 'capacidade_gb')
  const capacidadeGb = capacidadeTexto ? numeroOuNulo(capacidadeTexto) : null
  if (capacidadeTexto && (capacidadeGb === null || capacidadeGb <= 0)) return { linha, erro: 'Capacidade (GB) inválida.' }

  const bateriaTexto = campo(row, 'bateria_saude')
  const bateriaSaude = bateriaTexto ? numeroOuNulo(bateriaTexto) : null
  if (bateriaTexto && (bateriaSaude === null || bateriaSaude < 0 || bateriaSaude > 100)) {
    return { linha, erro: 'Saúde da bateria inválida — use um número de 0 a 100.' }
  }

  const precoSugeridoTexto = campo(row, 'preco_sugerido')
  const precoSugerido = precoSugeridoTexto ? numeroOuNulo(precoSugeridoTexto) : null
  if (precoSugeridoTexto && (precoSugerido === null || precoSugerido <= 0)) {
    return { linha, erro: 'Preço no catálogo público inválido.' }
  }

  return {
    linha,
    dados: {
      nome,
      categoria_id: null,
      fornecedor_id: null,
      identificador: null,
      modelo,
      cor: campo(row, 'cor') || null,
      capacidade_gb: capacidadeGb,
      bateria_saude: bateriaSaude,
      imei,
      imei2: imei2 || null,
      condicao: condicaoTexto as CondicaoAparelho,
      data_compra: dataCompra,
      custo_compra: custoCompra,
      custos_extras: [],
      dias_planejados: null,
      observacoes: campo(row, 'observacoes') || null,
      preco_sugerido: precoSugerido,
    },
  }
}

/** Valida todas as linhas e marca IMEIs repetidos dentro do próprio arquivo — sem isso, a 2ª linha só falharia depois, na constraint do banco, com um erro confuso. */
export function validarAparelhos(linhas: Record<string, string>[]): LinhaImportada<AparelhoInput>[] {
  const validadas = linhas.map((row, i) => validarLinhaAparelho(row, i + 2))
  const imeisVistos = new Map<string, number>()

  return validadas.map((resultado) => {
    if (!resultado.dados) return resultado
    const primeiraLinha = imeisVistos.get(resultado.dados.imei)
    if (primeiraLinha !== undefined) {
      return { linha: resultado.linha, erro: `IMEI duplicado — já aparece na linha ${primeiraLinha} deste arquivo.` }
    }
    imeisVistos.set(resultado.dados.imei, resultado.linha)
    return resultado
  })
}

export function validarLinhaCliente(row: Record<string, string>, linha: number): LinhaImportada<ClienteInput> {
  const nome = campo(row, 'nome')
  if (!nome) return { linha, erro: 'Nome é obrigatório.' }

  return {
    linha,
    dados: {
      nome,
      contato: campo(row, 'contato') || null,
      cpf: campo(row, 'cpf') || null,
      email: campo(row, 'email') || null,
      observacoes: campo(row, 'observacoes') || null,
    },
  }
}

export function validarClientes(linhas: Record<string, string>[]): LinhaImportada<ClienteInput>[] {
  return linhas.map((row, i) => validarLinhaCliente(row, i + 2))
}

export const TEMPLATE_CSV_APARELHOS = `nome,modelo,cor,capacidade_gb,bateria_saude,imei,imei2,condicao,data_compra,custo_compra,preco_sugerido,observacoes
iPhone 13 128GB,iPhone 13,Preto,128,92,352562041506190,,seminovo,2026-01-15,2200.00,2999.90,Comprado na troca de um cliente
`

export const TEMPLATE_CSV_CLIENTES = `nome,contato,cpf,email,observacoes
João da Silva,11999998888,,joao@email.com,Cliente frequente
`
