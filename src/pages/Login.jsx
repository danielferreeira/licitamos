import { useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Loader2, Lock, Mail, ArrowRight, CheckCircle, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'

export function Login() {
  const [isLogin, setIsLogin] = useState(true)
  const [loading, setLoading] = useState(false)
  const [pendingVerification, setPendingVerification] = useState(false) // Novo estado
  
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  
  const { signIn, signUp } = useAuth()

  async function handleSubmit(e) {
    e.preventDefault()
    if (!email || !password) return toast.warning("Preencha todos os campos")
    
    setLoading(true)
    try {
      if (isLogin) {
        // --- LOGIN ---
        const { error } = await signIn({ email, password })
        if (error) throw error
        // Redirecionamento é automático pelo AuthContext
      } else {
        // --- CADASTRO ---
        const { data, error } = await signUp({ email, password })
        if (error) throw error
        
        // Se o Supabase exigir confirmação, data.session virá nulo, mas data.user existe
        if (data.user && !data.session) {
          setPendingVerification(true)
          toast.success("Cadastro realizado! Verifique seu e-mail.")
        } else {
          toast.success("Conta criada com sucesso!")
        }
      }
    } catch (error) {
      console.error(error)
      let msg = "Erro ao realizar operação."
      
      // Traduções simples de erros comuns do Supabase
      if (error.message.includes("Invalid login")) msg = "E-mail ou senha incorretos."
      if (error.message.includes("already registered")) msg = "Este e-mail já está cadastrado."
      if (error.message.includes("password should be")) msg = "A senha deve ter pelo menos 6 caracteres."
      
      toast.error(msg)
    } finally {
      setLoading(false)
    }
  }

  // TELA DE VERIFICAÇÃO DE E-MAIL (Exibida após cadastro)
  if (pendingVerification) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center animate-fade-in border border-slate-100">
          <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-6">
            <Mail size={32} />
          </div>
          <h2 className="text-2xl font-bold text-slate-800 mb-2">Verifique seu E-mail</h2>
          <p className="text-slate-500 mb-6">
            Enviamos um link de confirmação para <strong>{email}</strong>.<br/>
            Clique no link para ativar sua conta e acessar o sistema.
          </p>
          <button 
            onClick={() => {
              setPendingVerification(false)
              setIsLogin(true) // Volta para tela de login
            }}
            className="text-brand-green font-bold hover:underline flex items-center justify-center gap-2 mx-auto"
          >
            <ArrowLeft size={16}/> Voltar para Login
          </button>
        </div>
      </div>
    )
  }

  // TELA DE LOGIN / CADASTRO PADRÃO
  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl shadow-slate-200/50 border border-slate-100 w-full max-w-md overflow-hidden animate-fade-in">
        
        <div className="pt-10 pb-2 px-8 flex flex-col items-center text-center">
            <img 
              src="/logo-full.png" 
              alt="Licitamos" 
              className="h-14 mb-6 object-contain"
              onError={(e) => {
                e.target.style.display = 'none'; 
                document.getElementById('fallback-login-logo').style.display = 'flex'
              }}
            />
            <div id="fallback-login-logo" className="hidden flex-col items-center mb-6">
               <h1 className="text-3xl font-extrabold text-brand-green tracking-tight">LICITAMOS</h1>
            </div>

            <h2 className="text-2xl font-bold text-slate-800">
              {isLogin ? 'Bem-vindo de volta!' : 'Crie sua conta'}
            </h2>
            <p className="text-sm text-slate-500 mt-2 mb-6">
              {isLogin ? 'Digite suas credenciais para acessar.' : 'Comece a gerenciar suas licitações hoje.'}
            </p>
        </div>

        <form onSubmit={handleSubmit} className="px-8 pb-10 space-y-5">
          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 ml-1">E-mail</label>
            <div className="relative group">
              <Mail className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-brand-green transition-colors" size={20}/>
              <input 
                type="email" 
                value={email}
                onChange={e => setEmail(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="seu@email.com"
                required
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-600 uppercase mb-1.5 ml-1">Senha</label>
            <div className="relative group">
              <Lock className="absolute left-3 top-3.5 text-slate-400 group-focus-within:text-brand-green transition-colors" size={20}/>
              <input 
                type="password" 
                value={password}
                onChange={e => setPassword(e.target.value)}
                className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:ring-2 focus:ring-brand-green outline-none transition text-slate-900 placeholder:text-slate-400 font-medium"
                placeholder="••••••••"
                required
                minLength={6}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={loading}
            className="w-full bg-brand-green hover:bg-brand-light text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-green/20 transition-all active:scale-[0.98] flex items-center justify-center gap-2 mt-4 text-lg"
          >
            {loading ? <Loader2 className="animate-spin" size={24}/> : (isLogin ? 'Entrar' : 'Cadastrar')}
            {!loading && <ArrowRight size={20}/>}
          </button>

          <div className="text-center mt-6 pt-4 border-t border-slate-100">
            <button 
              type="button"
              onClick={() => {
                setIsLogin(!isLogin)
                setPendingVerification(false)
              }}
              className="text-sm text-slate-500 hover:text-brand-green font-semibold transition-colors"
            >
              {isLogin ? 'Não tem uma conta? Crie grátis' : 'Já possui conta? Fazer login'}
            </button>
          </div>
        </form>
      </div>
      
      <div className="fixed bottom-6 text-xs text-slate-400 font-medium">
        &copy; {new Date().getFullYear()} Licitamos
      </div>
    </div>
  )
}