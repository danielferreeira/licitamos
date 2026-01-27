import { LayoutDashboard, Gavel, Settings, LogOut, User, PieChart, FileText } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

export function Layout({ children, onNavigate, currentPage }) {
  const { signOut, user } = useAuth()

  const getLinkClass = (page) => {
    const isActive = currentPage === page
    return `flex items-center gap-3 px-4 py-3 rounded-xl font-medium transition-all duration-200 cursor-pointer select-none ${
      isActive
        ? 'bg-brand-green text-white shadow-lg shadow-brand-green/30' 
        : 'text-slate-500 hover:bg-slate-50 hover:text-brand-green dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-brand-light'
    }`
  }

  const userName = user?.email ? user.email.split('@')[0] : 'Usuário'

  return (
    <div className="flex h-screen bg-slate-50 dark:bg-slate-950 font-sans text-slate-800 dark:text-slate-100 overflow-hidden transition-colors duration-300">
      
      {/* SIDEBAR */}
      <aside className="w-20 lg:w-72 bg-white dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 flex flex-col justify-between transition-all duration-300 z-20 shadow-sm shrink-0">
        
        <div>
          {/* Header Logo */}
          <div className="p-6 flex items-center justify-center gap-3 border-b border-slate-50 dark:border-slate-800 h-24">
            <img src="/logo-full.png" alt="Licitamos" className="hidden lg:block dark:hidden h-12 object-contain" onError={(e) => {e.target.style.display='none'; document.getElementById('fallback-logo').style.display='flex'}}/>
            <img src="/logo-full-dark.png" alt="Licitamos Dark" className="hidden dark:lg:block h-12 object-contain"/>
            <img src="/logo-icon.png" alt="Lc" className="block lg:hidden h-10 w-10 object-contain"/>
            <div id="fallback-logo" className="hidden items-center gap-2">
               <div className="w-10 h-10 bg-brand-green rounded-xl flex items-center justify-center text-white shadow-md"><Gavel size={20}/></div>
               <span className="hidden lg:block font-bold text-xl text-brand-green tracking-tight">Licitamos</span>
            </div>
          </div>

          {/* User Card */}
          <div className="px-4 py-6 hidden lg:block">
            <div className="flex items-center gap-3 p-3 bg-slate-50 dark:bg-slate-800 rounded-xl border border-slate-100 dark:border-slate-700">
              <div className="w-9 h-9 bg-white dark:bg-slate-700 rounded-full flex items-center justify-center text-brand-green border border-slate-200 dark:border-slate-600 shadow-sm"><User size={18} /></div>
              <div className="overflow-hidden">
                <p className="text-[10px] text-slate-400 dark:text-slate-500 font-bold uppercase tracking-wider leading-none mb-1">Logado como</p>
                <p className="text-sm font-semibold text-slate-700 dark:text-slate-200 truncate w-32" title={user?.email}>{userName}</p>
              </div>
            </div>
          </div>

          {/* Menu */}
          <nav className="px-4 pb-4 space-y-2 mt-2">
            <a onClick={() => onNavigate('dashboard')} className={getLinkClass('dashboard')}>
              <LayoutDashboard size={20} /> <span className="hidden lg:block">Visão Geral</span>
            </a>
            <a onClick={() => onNavigate('licitacoes')} className={getLinkClass('licitacoes')}>
              <Gavel size={20} /> <span className="hidden lg:block">Licitações / Funil</span>
            </a>
            <a onClick={() => onNavigate('financeiro')} className={getLinkClass('financeiro')}>
              <PieChart size={20} /> <span className="hidden lg:block">Financeiro</span>
            </a>
            <a onClick={() => onNavigate('relatorios')} className={getLinkClass('relatorios')}>
              <FileText size={20} /> <span className="hidden lg:block">Relatórios</span>
            </a>
            <a onClick={() => onNavigate('config')} className={getLinkClass('config')}>
              <Settings size={20} /> <span className="hidden lg:block">Configurações</span>
            </a>
          </nav>
        </div>

        {/* Logout */}
        <div className="p-4 border-t border-slate-50 dark:border-slate-800 bg-white dark:bg-slate-900">
          <button onClick={signOut} className="flex items-center gap-3 px-4 py-3 text-slate-400 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-900/20 dark:hover:text-red-400 w-full rounded-xl transition-colors font-medium group">
            <LogOut size={20} className="group-hover:-translate-x-1 transition-transform"/> <span className="hidden lg:block">Sair</span>
          </button>
        </div>
      </aside>

      <main className="flex-1 overflow-hidden relative flex flex-col">
        <div className="flex-1 overflow-y-auto p-4 lg:p-8 scroll-smooth custom-scrollbar">
          <div className="max-w-screen-2xl mx-auto h-full">
            {children}
          </div>
        </div>
      </main>
    </div>
  )
}