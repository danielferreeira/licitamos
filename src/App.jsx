import { useState } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Kanban } from './pages/Kanban'
import { Login } from './pages/Login'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { Toaster } from 'sonner'
import { Financial } from './pages/Financial'
import { Config } from './pages/Config'
import { ThemeProvider } from './contexts/ThemeContext'
import { Reports } from './pages/Reports'

function AppRoutes() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')

  if (!user) {
    return <Login />
  }

  return (
    <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'licitacoes' && <Kanban />}
      {currentPage === 'relatorios' && <Reports />}
      {currentPage === 'financeiro' && <Financial />}
      {currentPage === 'config' && <Config />}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      {/* 2. Envolver a aplicação com o ThemeProvider */}
      <ThemeProvider> 
        <Toaster position="top-right" richColors expand={true} />
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App