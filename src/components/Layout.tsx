import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'

const TABS = [
  { to: '/', label: 'Início', icon: '📊' },
  { to: '/lotes', label: 'Lotes', icon: '📦' },
  { to: '/itens', label: 'Itens', icon: '🏷️' },
  { to: '/despesas', label: 'Despesas', icon: '💸' },
  { to: '/config', label: 'Ajustes', icon: '⚙️' },
]

export function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Catira Control</h1>
        <button type="button" onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">
          Sair
        </button>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white">
        {TABS.map((tab) => (
          <NavLink
            key={tab.to}
            to={tab.to}
            end={tab.to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <span className="text-lg leading-none">{tab.icon}</span>
            {tab.label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
