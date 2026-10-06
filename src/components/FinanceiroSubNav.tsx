import { NavLink } from 'react-router-dom'

const ABAS = [
  { to: '/financeiro/pagar', label: 'A pagar' },
  { to: '/financeiro/receber', label: 'A receber' },
  { to: '/financeiro/cashback', label: 'Cashback' },
  { to: '/financeiro/clientes', label: 'Clientes' },
]

export function FinanceiroSubNav() {
  return (
    <div className="mb-4 flex rounded-lg border border-slate-200 bg-white p-1 text-sm font-semibold">
      {ABAS.map((aba) => (
        <NavLink
          key={aba.to}
          to={aba.to}
          className={({ isActive }) =>
            `flex-1 rounded-md py-1.5 text-center transition-colors ${
              isActive ? 'bg-brand text-white' : 'text-slate-500 hover:text-slate-900'
            }`
          }
        >
          {aba.label}
        </NavLink>
      ))}
    </div>
  )
}
