import { useState, useEffect } from 'react'
import { Layout } from './components/Layout'
import { Dashboard } from './pages/Dashboard'
import { Kanban } from './pages/Kanban'
import { Login } from './pages/Login'
import { Financial } from './pages/Financial'
import { Reports } from './pages/Reports' // Verifique se importou a página de Relatórios
import { Config } from './pages/Config'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { Toaster, toast } from 'sonner'
import { api } from './services/api' // Importante importar a API

function AppRoutes() {
  const { user } = useAuth()
  const [currentPage, setCurrentPage] = useState('dashboard')
  const [isCheckingProfile, setIsCheckingProfile] = useState(true)

  // Efeito para verificar o perfil no primeiro acesso
  useEffect(() => {
    async function checkFirstLogin() {
      if (user) {
        try {
          const profile = await api.getProfile()
          
          // CRITÉRIO DE PERFIL INCOMPLETO:
          // Se não tiver Nome da Empresa OU não tiver CNPJ, consideramos incompleto.
          const isIncomplete = !profile?.company_name || !profile?.cnpj

          if (isIncomplete) {
            setCurrentPage('config') // Força ir para Configurações
            // Pequeno delay para o toast não aparecer em cima da transição de tela
            setTimeout(() => {
              toast.info("👋 Bem-vindo! Complete seu cadastro para liberar todas as funções.", {
                duration: 5000,
                action: {
                  label: 'Entendi',
                  onClick: () => console.log('Undo')
                },
              })
            }, 500)
          }
        } catch (error) {
          console.error("Erro ao verificar perfil:", error)
        } finally {
          setIsCheckingProfile(false)
        }
      } else {
        setIsCheckingProfile(false)
      }
    }

    checkFirstLogin()
  }, [user]) // Executa sempre que o usuário muda (Loga)

  if (!user) {
    return <Login />
  }

  // Opcional: Mostrar loading enquanto verifica o perfil para não "piscar" o Dashboard
  /* if (isCheckingProfile) {
       return <div className="flex h-screen items-center justify-center bg-slate-50 dark:bg-slate-900"><Loader2 className="animate-spin text-brand-green"/></div>
     } 
  */

  return (
    <Layout onNavigate={setCurrentPage} currentPage={currentPage}>
      {currentPage === 'dashboard' && <Dashboard />}
      {currentPage === 'licitacoes' && <Kanban />}
      {currentPage === 'financeiro' && <Financial />}
      {currentPage === 'relatorios' && <Reports />}
      {currentPage === 'config' && <Config />}
    </Layout>
  )
}

function App() {
  return (
    <AuthProvider>
      <ThemeProvider>
        <Toaster position="top-right" richColors expand={true} />
        <AppRoutes />
      </ThemeProvider>
    </AuthProvider>
  )
}

export default App