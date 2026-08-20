import { lazy, Suspense } from 'react'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { IosInstallBanner } from './components/IosInstallBanner'
import { PwaUpdatePrompt } from './components/PwaUpdatePrompt'
import { LoadingSpinner } from './components/LoadingSpinner'
import { LoginPage } from './pages/LoginPage'

// Dashboard puxa Recharts (biblioteca pesada) — só carrega quando a rota é acessada.
const DashboardPage = lazy(() => import('./pages/DashboardPage').then((m) => ({ default: m.DashboardPage })))
const LotesPage = lazy(() => import('./pages/LotesPage').then((m) => ({ default: m.LotesPage })))
const ItensPage = lazy(() => import('./pages/ItensPage').then((m) => ({ default: m.ItensPage })))
const DespesasPage = lazy(() => import('./pages/DespesasPage').then((m) => ({ default: m.DespesasPage })))
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
                <Route path="/lotes" element={<LotesPage />} />
                <Route path="/itens" element={<ItensPage />} />
                <Route path="/despesas" element={<DespesasPage />} />
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
