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
      <header className="sticky top-0 z-40 flex items-center justify-between border-b border-slate-200 bg-white/80 px-4 py-3 backdrop-blur-sm">
        <h1 className="text-lg font-bold tracking-tight text-slate-900">Catira Control</h1>
        <div className="flex items-center gap-3">
          <SyncStatusBadge />
          <button
            type="button"
            onClick={signOut}
            className="rounded-md text-sm text-slate-500 transition-colors hover:text-slate-900"
          >
            Sair
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-y-auto px-4 py-4 pb-24">
        <Outlet />
      </main>

      <nav className="safe-bottom fixed inset-x-0 bottom-0 z-40 flex border-t border-slate-200 bg-white/95 backdrop-blur-sm">
        {TABS.map(({ to, label, Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === '/'}
            className={({ isActive }) =>
              `relative flex flex-1 flex-col items-center gap-0.5 py-2.5 text-xs transition-colors ${
                isActive ? 'font-semibold text-slate-900' : 'text-slate-400 hover:text-slate-600'
              }`
            }
          >
            {({ isActive }) => (
              <>
                {isActive && <span className="absolute top-0 h-0.5 w-8 rounded-full bg-slate-900" />}
                <Icon className="h-5 w-5" />
                {label}
              </>
            )}
          </NavLink>
        ))}
      </nav>
    </div>
  )
}
