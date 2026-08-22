import { NavLink, Outlet } from 'react-router-dom'
import { useAuth } from '../hooks/useAuth'
import { IconHome, IconSettings, IconTag } from './icons'
import { SyncStatusBadge } from './SyncStatusBadge'

const TABS = [
  { to: '/', label: 'Início', Icon: IconHome },
  { to: '/itens', label: 'Itens', Icon: IconTag },
  { to: '/config', label: 'Ajustes', Icon: IconSettings },
]

export function Layout() {
  const { signOut } = useAuth()

  return (
    <div className="flex min-h-screen flex-col bg-slate-50">
      <header className="flex items-center justify-between border-b border-slate-200 bg-white px-4 py-3">
        <h1 className="text-lg font-bold text-slate-900">Catira Control</h1>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <button type="button" onClick={signOut} className="text-sm text-slate-500 hover:text-slate-700">
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-20">
        <Outlet />
      </main>

      <nav className="fixed inset-x-0 bottom-0 flex border-t border-slate-200 bg-white">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `flex flex-1 flex-col items-center gap-0.5 py-2 text-xs ${
                isActive ? 'text-slate-900 font-semibold' : 'text-slate-400'
              }`
            }
          >
            <Icon className="h-5 w-5" />
            {label}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
