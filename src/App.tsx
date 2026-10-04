import { lazy, Suspense } from 'react'
import { BrowserRouter, Navigate, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { IosInstallBanner } from './components/IosInstallBanner'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { LoadingSpinner } from './components/LoadingSpinner'
import { LoginPage } from './pages/LoginPage'

// Cada rota carrega sob demanda — só o bundle da tela acessada entra no download inicial.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const EstoqueAparelhosPage = lazy(() =>
  import('./pages/EstoqueAparelhosPage').then((m) => ({ default: m.EstoqueAparelhosPage })),
)
const EstoqueAcessoriosPage = lazy(() =>
  import('./pages/EstoqueAcessoriosPage').then((m) => ({ default: m.EstoqueAcessoriosPage })),
)
const VendasPage = lazy(() => import('./pages/VendasPage').then((m) => ({ default: m.VendasPage })))
const NovaVendaPage = lazy(() => import('./pages/NovaVendaPage').then((m) => ({ default: m.NovaVendaPage })))
const SimuladorUpgradePage = lazy(() =>
  import('./pages/SimuladorUpgradePage').then((m) => ({ default: m.SimuladorUpgradePage })),
)
const ConfiguracoesPage = lazy(() =>
  import('./pages/ConfiguracoesPage').then((m) => ({ default: m.ConfiguracoesPage })),
)

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <IosInstallBanner />
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route element={<ProtectedRoute />}>
              <Route element={<Layout />}>
                <Route path="/" element={<DashboardPage />} />
                <Route path="/estoque" element={<Navigate to="/estoque/aparelhos" replace />} />
                <Route path="/estoque/aparelhos" element={<EstoqueAparelhosPage />} />
                <Route path="/estoque/acessorios" element={<EstoqueAcessoriosPage />} />
                <Route path="/vendas" element={<VendasPage />} />
                <Route path="/vendas/nova" element={<NovaVendaPage />} />
                <Route path="/simulador" element={<SimuladorUpgradePage />} />
                <Route path="/config" element={<ConfiguracoesPage />} />
              </Route>
            </Route>
          </Routes>
        </Suspense>
        <PwaUpdatePrompt />
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
