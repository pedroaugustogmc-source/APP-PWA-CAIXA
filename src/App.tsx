import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { AuthProvider } from './hooks/useAuth'
import { ProtectedRoute } from './components/ProtectedRoute'
import { Layout } from './components/Layout'
import { LoginPage } from './pages/LoginPage'
import { DashboardPage } from './pages/DashboardPage'
import { LotesPage } from './pages/LotesPage'
import { ItensPage } from './pages/ItensPage'
import { DespesasPage } from './pages/DespesasPage'
import { ConfiguracoesPage } from './pages/ConfiguracoesPage'

function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  )
}

export default App
