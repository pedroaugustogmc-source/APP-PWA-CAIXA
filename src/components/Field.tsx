import type { ReactNode } from 'react'

// min-h-11: tamanho padrão pra todo campo do app. Sem altura fixa, cada
// navegador/sistema decide sozinho a altura mínima de cada tipo de campo
// (um <input type="date"> nativo, por exemplo, pode exigir mais espaço
// interno que um campo de texto comum) e os campos ficam com alturas
// diferentes entre si dependendo do aparelho — min-h força todos pro
// mesmo tamanho, e ainda deixa um <textarea> crescer normalmente com rows.
export const inputClass =
  'w-full min-h-11 rounded-lg border border-slate-300 bg-white px-3 py-2 text-base text-slate-900 transition-colors placeholder:text-slate-400 focus:border-brand focus:outline-none focus:ring-2 focus:ring-brand/15 disabled:bg-slate-50 disabled:text-slate-400'

export function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    // min-w-0: sem isso, um item de grid/flex nunca encolhe abaixo do
    // tamanho intrínseco do conteúdo — e um <input type="date"> em pt-BR
    // (ex.: "19 de out. de 2026") é largo o bastante pra estourar a coluna
    // numa grid-cols-2, empurrando o layout inteiro.
    <label className="block min-w-0 text-sm">
      <span className="mb-1 block font-medium text-slate-700">{label}</span>
      {children}
    </label>
  )
}
