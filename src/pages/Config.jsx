import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { Save, Building2, ShieldCheck, Download, Upload, Loader2, User, Moon, Sun, Monitor, MapPin, Wallet, FileSignature } from 'lucide-react'
import { toast } from 'sonner'
import { useAuth } from '../contexts/AuthContext'
import { maskDocument, maskPhone, maskZipCode, maskCpf } from '../utils/formatters'
import { useTheme } from '../contexts/ThemeContext'
import { external } from '../services/external'

export function Config() {
  const { user } = useAuth()
  const { theme, setTheme } = useTheme()
  
  const [activeTab, setActiveTab] = useState('company')
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [importing, setImporting] = useState(false)
  
  // Estado Completo do Perfil
  const [profile, setProfile] = useState({
    company_name: '', cnpj: '', email_contact: '', phone: '', website: '',
    street: '', number: '', neighborhood: '', city: '', state: '', zip_code: '',
    representative_name: '', representative_cpf: '',
    bank_name: '', bank_agency: '', bank_account: '', pix_key: ''
  })

  useEffect(() => { loadProfile() }, [])

  async function loadProfile() {
    setLoading(true)
    try {
      const data = await api.getProfile()
      if (data) setProfile(prev => ({ ...prev, ...data }))
    } catch (error) { console.error(error) } 
    finally { setLoading(false) }
  }

  // Busca CEP automática
  async function handleSearchCEP(cep) {
    if (cep.length < 9) return
    try {
       const address = await external.fetchCEP(cep)
       setProfile(prev => ({ ...prev, ...address }))
       toast.success("Endereço encontrado!")
    } catch (e) { console.log('Erro CEP', e) }
  }

  async function handleSaveProfile(e) {
    e.preventDefault()
    setSaving(true)
    try {
      await api.saveProfile(profile)
      toast.success("Dados da empresa atualizados!")
    } catch (error) { toast.error("Erro ao salvar perfil.") } 
    finally { setSaving(false) }
  }

  // --- FUNÇÕES DE BACKUP E IMPORTAÇÃO (RESTAURADAS) ---
  
  async function handleBackup() {
    const promise = async () => {
      const data = await api.getFullBackup()
      const jsonString = `data:text/json;chatset=utf-8,${encodeURIComponent(JSON.stringify(data, null, 2))}`
      const link = document.createElement("a")
      link.href = jsonString
      link.download = `backup_licitamos_${new Date().toISOString().split('T')[0]}.json`
      link.click()
    }
    toast.promise(promise, { loading: 'Gerando backup...', success: 'Download iniciado!', error: 'Erro ao gerar backup' })
  }

  async function handleImport(event) {
    const file = event.target.files[0]
    if (!file) return

    if (!window.confirm("ATENÇÃO: Importar dados pode sobrescrever informações existentes com o mesmo ID. Deseja continuar?")) {
      event.target.value = ''
      return
    }

    setImporting(true)
    const reader = new FileReader()
    
    reader.onload = async (e) => {
      try {
        const json = JSON.parse(e.target.result)
        const result = await api.importData(json)
        toast.success(`Importação concluída! ${result.clientsCount} clientes e ${result.bidsCount} licitações processados.`)
        // Opcional: Recarregar a página após importar
        setTimeout(() => window.location.reload(), 1500)
      } catch (error) {
        toast.error("Falha na importação: " + error.message)
      } finally {
        setImporting(false)
        event.target.value = ''
      }
    }
    
    reader.readAsText(file)
  }

  return (
    <div className="animate-fade-in max-w-4xl mx-auto pb-10">
      <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Configurações</h1>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Gerencie seus dados e preferências do sistema.</p>

      {/* ABAS */}
      <div className="flex gap-2 mb-8 border-b border-slate-200 dark:border-slate-700 overflow-x-auto">
        {[
          { id: 'company', icon: Building2, label: 'Minha Empresa' },
          { id: 'appearance', icon: Monitor, label: 'Aparência' },
          { id: 'security', icon: ShieldCheck, label: 'Dados e Segurança' },
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`flex items-center gap-2 px-6 py-3 font-bold text-sm border-b-2 transition-colors whitespace-nowrap ${
              activeTab === tab.id 
                ? 'border-brand-green text-brand-green' 
                : 'border-transparent text-slate-500 hover:text-slate-300 dark:text-slate-400 dark:hover:text-slate-200'
            }`}
          >
            <tab.icon size={18}/> {tab.label}
          </button>
        ))}
      </div>

      {/* 1. ABA MINHA EMPRESA */}
      {activeTab === 'company' && (
        <form onSubmit={handleSaveProfile} className="space-y-6 animate-fade-in">
          
          {/* BLOCO 1: DADOS GERAIS */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <Building2 className="text-brand-green" size={20}/> Dados Cadastrais
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
              <div className="col-span-2">
                <label className="label-title">Razão Social</label>
                <input className="input-field" value={profile.company_name || ''} onChange={e => setProfile({...profile, company_name: e.target.value})} placeholder="Sua Empresa Ltda" />
              </div>
              <div>
                <label className="label-title">CNPJ</label>
                <input className="input-field" value={profile.cnpj || ''} onChange={e => setProfile({...profile, cnpj: maskDocument(e.target.value)})} maxLength={18} />
              </div>
              <div>
                <label className="label-title">Telefone / WhatsApp</label>
                <input className="input-field" value={profile.phone || ''} onChange={e => setProfile({...profile, phone: maskPhone(e.target.value)})} maxLength={15} />
              </div>
              <div className="col-span-2">
                <label className="label-title">E-mail Comercial</label>
                <input type="email" className="input-field" value={profile.email_contact || ''} onChange={e => setProfile({...profile, email_contact: e.target.value})} />
              </div>
            </div>
          </div>

          {/* BLOCO 2: ENDEREÇO */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
               <MapPin className="text-brand-green" size={20}/> Endereço
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-5">
              <div>
                <label className="label-title">CEP</label>
                <input className="input-field" value={profile.zip_code || ''} 
                  onChange={e => {
                    const val = maskZipCode(e.target.value);
                    setProfile({...profile, zip_code: val});
                    if(val.length === 9) handleSearchCEP(val);
                  }} maxLength={9} placeholder="00000-000"/>
              </div>
              <div className="md:col-span-3">
                <label className="label-title">Logradouro (Rua, Av)</label>
                <input className="input-field" value={profile.street || ''} onChange={e => setProfile({...profile, street: e.target.value})} />
              </div>
              <div>
                 <label className="label-title">Número</label>
                 <input className="input-field" value={profile.number || ''} onChange={e => setProfile({...profile, number: e.target.value})} />
              </div>
              <div>
                 <label className="label-title">Bairro</label>
                 <input className="input-field" value={profile.neighborhood || ''} onChange={e => setProfile({...profile, neighborhood: e.target.value})} />
              </div>
              <div>
                 <label className="label-title">Cidade</label>
                 <input className="input-field" value={profile.city || ''} onChange={e => setProfile({...profile, city: e.target.value})} />
              </div>
              <div>
                 <label className="label-title">UF</label>
                 <input className="input-field uppercase" value={profile.state || ''} onChange={e => setProfile({...profile, state: e.target.value.toUpperCase()})} maxLength={2} />
              </div>
            </div>
          </div>

          {/* BLOCO 3: REPRESENTANTE & BANCO */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
             {/* Representante */}
             <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <FileSignature className="text-brand-green" size={20}/> Representante Legal
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="label-title">Nome Completo</label>
                    <input className="input-field" value={profile.representative_name || ''} onChange={e => setProfile({...profile, representative_name: e.target.value})} placeholder="Quem assina o contrato" />
                  </div>
                  <div>
                    <label className="label-title">CPF</label>
                    <input className="input-field" value={profile.representative_cpf || ''} onChange={e => setProfile({...profile, representative_cpf: maskCpf ? maskCpf(e.target.value) : e.target.value})} maxLength={14} placeholder="000.000.000-00"/>
                  </div>
                </div>
             </div>

             {/* Dados Bancários */}
             <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700">
                <h3 className="font-bold text-lg text-slate-800 dark:text-white mb-6 flex items-center gap-2">
                  <Wallet className="text-brand-green" size={20}/> Dados Bancários
                </h3>
                <div className="space-y-4">
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-title">Banco</label>
                        <input className="input-field" value={profile.bank_name || ''} onChange={e => setProfile({...profile, bank_name: e.target.value})} placeholder="Ex: Nubank" />
                      </div>
                      <div>
                        <label className="label-title">Chave PIX</label>
                        <input className="input-field" value={profile.pix_key || ''} onChange={e => setProfile({...profile, pix_key: e.target.value})} />
                      </div>
                   </div>
                   <div className="grid grid-cols-2 gap-4">
                      <div>
                        <label className="label-title">Agência</label>
                        <input className="input-field" value={profile.bank_agency || ''} onChange={e => setProfile({...profile, bank_agency: e.target.value})} />
                      </div>
                      <div>
                        <label className="label-title">Conta</label>
                        <input className="input-field" value={profile.bank_account || ''} onChange={e => setProfile({...profile, bank_account: e.target.value})} />
                      </div>
                   </div>
                </div>
             </div>
          </div>

          <div className="flex justify-end pt-4">
            <button type="submit" disabled={saving} className="bg-brand-green hover:bg-brand-light text-white px-8 py-4 rounded-xl font-bold shadow-lg shadow-brand-green/20 transition flex items-center gap-2 text-lg">
              {saving ? <Loader2 className="animate-spin" size={24}/> : <Save size={24}/>} Salvar Alterações
            </button>
          </div>
        </form>
      )}

      {/* ABA APARÊNCIA */}
      {activeTab === 'appearance' && (
         <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 animate-fade-in transition-colors">
            <div className="flex items-center gap-4 mb-8">
              <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center text-brand-green">
                <Monitor size={32}/>
              </div>
              <div>
                <h3 className="font-bold text-lg text-slate-800 dark:text-white">Modo de Exibição</h3>
                <p className="text-sm text-slate-500 dark:text-slate-400">Escolha como o sistema aparece para você.</p>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={() => setTheme('light')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'light' ? 'border-brand-green bg-green-50/50 dark:bg-green-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                <Sun size={32} className={theme === 'light' ? 'text-brand-green' : 'text-slate-400'}/>
                <span className={`font-bold ${theme === 'light' ? 'text-brand-green' : 'text-slate-700 dark:text-slate-300'}`}>Claro</span>
              </button>
              
              <button onClick={() => setTheme('dark')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'dark' ? 'border-brand-green bg-slate-800' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                <Moon size={32} className={theme === 'dark' ? 'text-brand-green' : 'text-slate-400'}/>
                <span className={`font-bold ${theme === 'dark' ? 'text-white' : 'text-slate-700 dark:text-slate-300'}`}>Escuro</span>
              </button>

              <button onClick={() => setTheme('system')} className={`p-4 rounded-xl border-2 flex flex-col items-center gap-3 transition-all ${theme === 'system' ? 'border-brand-green bg-green-50/50 dark:bg-green-900/20' : 'border-slate-100 dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-500'}`}>
                <Monitor size={32} className={theme === 'system' ? 'text-brand-green' : 'text-slate-400'}/>
                <span className={`font-bold ${theme === 'system' ? 'text-brand-green' : 'text-slate-700 dark:text-slate-300'}`}>Sistema</span>
              </button>
            </div>
         </div>
      )}

      {/* ABA SEGURANÇA (RESTAURADA COM IMPORT/EXPORT) */}
      {activeTab === 'security' && (
         <div className="space-y-6 animate-fade-in">
           {/* Cartão Conta */}
           <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 flex items-center gap-6 transition-colors">
            <div className="w-16 h-16 bg-slate-100 dark:bg-slate-700 text-slate-400 rounded-full flex items-center justify-center">
              <User size={32}/>
            </div>
            <div>
              <h3 className="font-bold text-lg text-slate-900 dark:text-white">Conta Conectada</h3>
              <p className="text-slate-500 dark:text-slate-400">{user?.email}</p>
            </div>
          </div>

          {/* Cartão Backup & Restore */}
          <div className="bg-white dark:bg-slate-800 rounded-2xl p-8 shadow-sm border border-slate-100 dark:border-slate-700 transition-colors">
            <h3 className="font-bold text-lg text-slate-900 dark:text-white mb-2">Gerenciamento de Dados</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 mb-6">Exporte seus dados para segurança ou importe um backup anterior.</p>
            
            <div className="flex flex-col sm:flex-row gap-4">
              <button 
                onClick={handleBackup}
                className="flex-1 border-2 border-slate-200 dark:border-slate-600 hover:border-brand-green hover:text-brand-green text-slate-600 dark:text-slate-300 px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2"
              >
                <Download size={20}/> Fazer Backup (Exportar)
              </button>

              <div className="flex-1 relative">
                <input 
                  type="file" 
                  accept=".json"
                  onChange={handleImport}
                  disabled={importing}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed"
                />
                <button 
                  disabled={importing}
                  className="w-full h-full bg-slate-50 dark:bg-slate-700 hover:bg-slate-100 dark:hover:bg-slate-600 text-slate-700 dark:text-slate-200 px-6 py-3 rounded-xl font-bold transition flex items-center justify-center gap-2 border border-slate-200 dark:border-slate-600"
                >
                  {importing ? <Loader2 className="animate-spin" size={20}/> : <Upload size={20}/>}
                  {importing ? "Importando..." : "Importar Backup"}
                </button>
              </div>
            </div>
            
            <p className="text-xs text-slate-400 mt-3 text-center">
              A importação suporta arquivos .json gerados pelo próprio Licitamos.
            </p>
          </div>
         </div>
      )}
    </div>
  )
}