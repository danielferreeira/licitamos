import { createContext, useState, useEffect, useContext } from 'react'
import { supabase } from '../services/api' // Ajuste o import se seu supabase client estiver em outro lugar

const AuthContext = createContext({})

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // 1. Verificar sessão atual
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    // 2. Escutar mudanças (Login, Logout, Confirmação de Email)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null)
      setLoading(false)
    })

    return () => subscription.unsubscribe()
  }, [])

  const value = {
    // Adicionamos options para garantir o redirect correto
    signUp: (data) => supabase.auth.signUp({
      ...data,
      options: {
        emailRedirectTo: window.location.origin // Redireciona para a URL atual (localhost ou vercel)
      }
    }),
    signIn: (data) => supabase.auth.signInWithPassword(data),
    signOut: () => supabase.auth.signOut(),
    user,
  }

  return (
    <AuthContext.Provider value={value}>
      {!loading && children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)