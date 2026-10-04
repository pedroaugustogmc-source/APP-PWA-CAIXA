import { useState } from 'react'
import { Modal } from './Modal'
import { Button } from './Button'
import { ErrorMessage } from './ErrorMessage'
import { parseCsv, type LinhaImportada } from '../lib/csvImport'

interface ResultadoFinal {
  sucesso: number
  falhas: { linha: number; erro: string }[]
}

interface Props<T> {
  titulo: string
  templateCsv: string
  templateNomeArquivo: string
  colunasAjuda: string
  validar: (linhas: Record<string, string>[]) => LinhaImportada<T>[]
  onImportar: (validos: T[]) => Promise<{ index: number; error: string | null }[]>
  onClose: () => void
}

export function ImportarCsvModal<T>({
  titulo,
  templateCsv,
  templateNomeArquivo,
  colunasAjuda,
  validar,
  onImportar,
  onClose,
}: Props<T>) {
  const [resultados, setResultados] = useState<LinhaImportada<T>[] | null>(null)
  const [erroArquivo, setErroArquivo] = useState<string | null>(null)
  const [importando, setImportando] = useState(false)
  const [resultadoFinal, setResultadoFinal] = useState<ResultadoFinal | null>(null)

  const validos = resultados?.filter((r) => r.dados !== undefined) ?? []
  const invalidos = resultados?.filter((r) => r.erro !== undefined) ?? []

  function baixarTemplate() {
    const blob = new Blob([templateCsv], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = templateNomeArquivo
    a.click()
    URL.revokeObjectURL(url)
  }

  function handleArquivo(e: React.ChangeEvent<HTMLInputElement>) {
    const arquivo = e.target.files?.[0]
    if (!arquivo) return
    setErroArquivo(null)
    setResultadoFinal(null)

    const reader = new FileReader()
    reader.onload = () => {
      const texto = String(reader.result ?? '')
      const { headers, linhas } = parseCsv(texto)
      if (headers.length === 0 || linhas.length === 0) {
        setErroArquivo('Arquivo vazio ou em formato inválido.')
        setResultados(null)
        return
      }
      setResultados(validar(linhas))
    }
    reader.onerror = () => setErroArquivo('Não foi possível ler o arquivo.')
    reader.readAsText(arquivo, 'utf-8')
  }

  async function handleImportar() {
    const dados = validos.map((r) => r.dados as T)
    if (dados.length === 0) return
    setImportando(true)
    const retorno = await onImportar(dados)
    setImportando(false)

    const falhas = retorno
      .filter((r) => r.error !== null)
      .map((r) => ({ linha: validos[r.index]?.linha ?? -1, erro: r.error as string }))
    setResultadoFinal({ sucesso: retorno.length - falhas.length, falhas })
    setResultados(null)
  }

  return (
    <Modal title={titulo} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-lg bg-slate-50 p-3 text-xs text-slate-500">
          <p className="mb-1 font-semibold text-slate-700">Colunas esperadas</p>
          <p>{colunasAjuda}</p>
          <button type="button" onClick={baixarTemplate} className="mt-2 font-semibold text-slate-700 underline hover:text-slate-900">
            Baixar modelo de exemplo (.csv)
          </button>
        </div>

        {!resultadoFinal && (
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Selecione o arquivo CSV</label>
            <input
              type="file"
              accept=".csv,text/csv"
              onChange={handleArquivo}
              className="block w-full text-sm text-slate-600 file:mr-3 file:rounded-lg file:border-0 file:bg-slate-900 file:px-3 file:py-2 file:text-xs file:font-semibold file:text-white"
            />
          </div>
        )}

        {erroArquivo && <ErrorMessage message={erroArquivo} />}

        {resultados && (
          <div className="space-y-3">
            <p className="text-sm text-slate-600">
              <strong className="text-profit">{validos.length}</strong> linha(s) válida(s)
              {invalidos.length > 0 && (
                <>
                  {' '}
                  · <strong className="text-loss">{invalidos.length}</strong> com erro
                </>
              )}
            </p>

            {invalidos.length > 0 && (
              <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-loss">
                {invalidos.map((r) => (
                  <li key={r.linha}>
                    Linha {r.linha}: {r.erro}
                  </li>
                ))}
              </ul>
            )}

            <Button type="button" variant="primary" fullWidth disabled={validos.length === 0 || importando} onClick={handleImportar}>
              {importando ? 'Importando…' : `Importar ${validos.length} linha(s) válida(s)`}
            </Button>
          </div>
        )}

        {resultadoFinal && (
          <div className="space-y-3">
            <p className="rounded-lg border border-profit/25 bg-profit/5 px-3 py-2 text-sm font-medium text-profit">
              {resultadoFinal.sucesso} importado(s) com sucesso.
            </p>
            {resultadoFinal.falhas.length > 0 && (
              <>
                <p className="text-sm font-medium text-loss">{resultadoFinal.falhas.length} falharam:</p>
                <ul className="max-h-40 space-y-1 overflow-y-auto rounded-lg border border-red-100 bg-red-50 p-2 text-xs text-loss">
                  {resultadoFinal.falhas.map((f) => (
                    <li key={f.linha}>
                      Linha {f.linha}: {f.erro}
                    </li>
                  ))}
                </ul>
              </>
            )}
            <Button type="button" variant="secondary" fullWidth onClick={onClose}>
              Fechar
            </Button>
          </div>
        )}
      </div>
    </Modal>
  )
}
