import type { InputHTMLAttributes } from 'react'

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, 'type' | 'className'>

/**
 * <input type="date"> comum, mas com a borda arredondada num contêiner
 * próprio em vez de no input. No Safari do iOS, o ícone de calendário
 * nativo às vezes é desenhado por fora do border-radius do próprio input,
 * deixando uma mordida no canto — acontece só em telas estreitas (onde o
 * ícone fica mais perto da borda) e só nesse navegador específico, então
 * não aparece testando no Chrome/computador. overflow-hidden no contêiner
 * corta qualquer coisa que o navegador tente desenhar fora do arredondado,
 * não importa como o sistema operacional renderize o ícone por dentro.
 */
export function DateInput(props: Props) {
  return (
    // min-h-11, igual ao inputClass (Field.tsx): mesma altura padrão de
    // todo campo do app, não a que o <input type="date"> nativo decidir
    // sozinho dependendo do navegador/sistema.
    <div className="flex min-h-11 items-center overflow-hidden rounded-lg border border-slate-300 bg-white transition-colors focus-within:border-brand focus-within:ring-2 focus-within:ring-brand/15">
      <input
        type="date"
        {...props}
        className="h-full w-full border-0 bg-transparent px-3 text-base text-slate-900 placeholder:text-slate-400 focus:outline-none disabled:bg-slate-50 disabled:text-slate-400"
      />
    </div>
  )
}
