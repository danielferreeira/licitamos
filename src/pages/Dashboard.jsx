import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { ClientCard } from '../components/ClientCard'
import { ClientModal } from '../components/ClientModal'
import { ClientDetailsModal } from '../components/ClientDetailsModal'
import { Plus, Search, Users, AlertTriangle, CheckCircle, XCircle, Trash2 } from 'lucide-react'
import { skeletonClass } from '../utils/formatters'
import { toast } from 'sonner'

export function Dashboard() {
  const [clients, setClients] = useState([])
  const [stats, setStats] = useState({ clients: 0, expired: 0, expiring: 0 })
  const [loading, setLoading] = useState(true)
  
  const [searchTerm, setSearchTerm] = useState('')
  const [activeFilter, setActiveFilter] = useState('all')
  
  const [modalOpen, setModalOpen] = useState(false)
  const [historyOpen, setHistoryOpen] = useState(false)
  const [selectedClient, setSelectedClient] = useState(null)
  
  const [clientToDelete, setClientToDelete] = useState(null)
  const [isDeleting, setIsDeleting] = useState(false)

  useEffect(() => { loadData() }, [])

  async function loadData() {
    try {
      const data = await api.getClients()
      const clientsList = data || []
      setClients(clientsList)
      calculateStats(clientsList)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }

  function calculateStats(clientsData) {
    const today = new Date().toISOString().split('T')[0]
    const next30 = new Date()
    next30.setDate(next30.getDate() + 30)
    const next30Str = next30.toISOString().split('T')[0]

    let expiredCount = 0
    let expiringCount = 0

    clientsData.forEach(client => {
      // Garante que lê a propriedade correta
      const docs = client.client_documents || [] 

      if (docs.length > 0) {
        if (docs.some(doc => doc.expiration_date < today)) expiredCount++
        if (docs.some(doc => doc.expiration_date >= today && doc.expiration_date <= next30Str)) expiringCount++
      }
    })

    setStats({
      clients: clientsData.length,
      expired: expiredCount,
      expiring: expiringCount
    })
  }

  // --- CORREÇÃO PRINCIPAL AQUI ---
  function checkStatus(client, type) {
    // ANTES: if (!client.documents ... (Isso causava o erro)
    // DEPOIS: Usamos client.client_documents
    const docs = client.client_documents || [] 
    
    if (docs.length === 0) return false

    const today = new Date().toISOString().split('T')[0]
    const next30 = new Date()
    next30.setDate(next30.getDate() + 30)
    const next30Str = next30.toISOString().split('T')[0]

    if (type === 'expired') {
        return docs.some(doc => doc.expiration_date < today)
    }
    
    if (type === 'expiring') {
        return docs.some(doc => doc.expiration_date >= today && doc.expiration_date <= next30Str)
    }
    
    return false
  }

  const filteredClients = clients.filter(c => {
    const matchesSearch = c.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          c.city?.toLowerCase().includes(searchTerm.toLowerCase())
    
    let matchesFilter = true
    
    // A lógica de filtro agora chama a função checkStatus corrigida acima
    if (activeFilter === 'expired') matchesFilter = checkStatus(c, 'expired')
    if (activeFilter === 'expiring') matchesFilter = checkStatus(c, 'expiring')
    
    return matchesSearch && matchesFilter
  })

  async function handleSave(clientData) {
    await api.saveClient(clientData)
    setModalOpen(false)
    loadData()
  }

  function confirmDeleteRequest(clientId) {
    const client = clients.find(c => c.id === clientId)
    setClientToDelete(client)
  }

  async function executeDelete() {
    if (!clientToDelete) return
    setIsDeleting(true)
    try {
      await api.deleteClient(clientToDelete.id)
      toast.success("Cliente removido.")
      loadData()
    } catch (error) {
      toast.error("Erro ao excluir.")
    } finally {
      setIsDeleting(false)
      setClientToDelete(null)
    }
  }

  return (
    <div className="max-w-7xl mx-auto animate-fade-in pb-10">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Visão Geral</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Resumo da sua carteira de clientes.</p>
        </div>
        <button 
          onClick={() => { setSelectedClient(null); setModalOpen(true); }}
          className="bg-brand-green hover:bg-brand-light text-white px-6 py-3 rounded-xl font-bold flex items-center justify-center gap-2 shadow-lg shadow-brand-green/20 transition-all hover:-translate-y-0.5"
        >
          <Plus size={20} /> Novo Cliente
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        
        <button onClick={() => setActiveFilter('all')} className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 
          ${activeFilter === 'all' 
            ? 'ring-2 ring-blue-500 border-transparent shadow-lg shadow-blue-100 dark:shadow-none bg-white dark:bg-slate-800' 
            : 'bg-white dark:bg-slate-800 border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-700 hover:shadow-md'}`}>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl"><Users size={24} /></div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Clientes</p>
            {loading ? <div className={`h-8 w-12 mt-1 ${skeletonClass} dark:bg-slate-700`}></div> : <h3 className="text-2xl font-bold text-slate-800 dark:text-white">{stats.clients}</h3>}
          </div>
        </button>

        <button onClick={() => setActiveFilter('expired')} className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 relative overflow-hidden 
          ${activeFilter === 'expired' 
            ? 'ring-2 ring-red-500 border-transparent shadow-lg shadow-red-100 dark:shadow-none bg-white dark:bg-slate-800' 
            : 'bg-white dark:bg-slate-800 border-red-100 dark:border-red-900/40 hover:border-red-300 dark:hover:border-red-700 hover:shadow-md'}`}>
          <div className={`absolute right-0 top-0 h-full w-1 ${!loading && stats.expired > 0 ? 'bg-red-500' : 'bg-slate-100 dark:bg-slate-700'}`}></div>
          <div className="p-3 bg-red-50 dark:bg-red-500/10 text-red-600 dark:text-red-400 rounded-xl"><AlertTriangle size={24} /></div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Docs Vencidos</p>
            {loading ? <div className={`h-8 w-12 mt-1 ${skeletonClass} dark:bg-slate-700`}></div> : <h3 className={`text-2xl font-bold ${stats.expired > 0 ? 'text-red-600 dark:text-red-400' : 'text-slate-800 dark:text-white'}`}>{stats.expired}</h3>}
          </div>
        </button>

        <button onClick={() => setActiveFilter('expiring')} className={`p-5 rounded-2xl border text-left flex items-center gap-4 transition-all duration-200 
          ${activeFilter === 'expiring' 
            ? 'ring-2 ring-amber-500 border-transparent shadow-lg shadow-amber-100 dark:shadow-none bg-white dark:bg-slate-800' 
            : 'bg-white dark:bg-slate-800 border-amber-100 dark:border-amber-900/40 hover:border-amber-300 dark:hover:border-amber-700 hover:shadow-md'}`}>
          <div className="p-3 bg-amber-50 dark:bg-amber-500/10 text-amber-600 dark:text-amber-400 rounded-xl"><CheckCircle size={24} /></div>
          <div>
            <p className="text-slate-500 dark:text-slate-400 text-xs font-bold uppercase tracking-wider">Docs a Vencer (30d)</p>
            {loading ? <div className={`h-8 w-12 mt-1 ${skeletonClass} dark:bg-slate-700`}></div> : <h3 className={`text-2xl font-bold ${stats.expiring > 0 ? 'text-amber-600 dark:text-amber-400' : 'text-slate-800 dark:text-white'}`}>{stats.expiring}</h3>}
          </div>
        </button>
      </div>

      {/* Busca */}
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 mb-8">
        <div className="relative w-full group">
          <Search className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-brand-green transition-colors" size={20} />
          <input 
            type="text"
            placeholder="Buscar empresa, cidade..."
            className="w-full pl-12 pr-4 py-3 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl focus:ring-2 focus:ring-brand-green dark:focus:ring-brand-light outline-none transition shadow-sm text-slate-700 dark:text-slate-200 placeholder:text-slate-400 dark:placeholder:text-slate-500"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
          />
        </div>

        {activeFilter !== 'all' && (
          <button onClick={() => setActiveFilter('all')} className="whitespace-nowrap px-4 py-3 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-600 dark:text-slate-300 rounded-xl text-sm font-bold flex items-center gap-2 transition">
            <XCircle size={16}/> Limpar Filtros
          </button>
        )}
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
        {loading ? (
          [...Array(6)].map((_, i) => (
            <div key={i} className="bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-100 dark:border-slate-700 shadow-sm h-48 flex flex-col justify-between">
              <div className="space-y-3">
                <div className={`h-6 w-3/4 ${skeletonClass} dark:bg-slate-700`}></div>
                <div className={`h-4 w-1/2 ${skeletonClass} dark:bg-slate-700`}></div>
              </div>
              <div className={`h-8 w-full mt-4 ${skeletonClass} dark:bg-slate-700`}></div>
            </div>
          ))
        ) : filteredClients.length > 0 ? (
          filteredClients.map(client => (
            <ClientCard 
              key={client.id} 
              client={client}
              onOpenDetails={(c) => { setSelectedClient(c); setHistoryOpen(true); }}
              onEdit={(c) => { setSelectedClient(c); setModalOpen(true); }}
              onDelete={confirmDeleteRequest}
            />
          ))
        ) : (
          <div className="col-span-full py-20 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-3xl bg-slate-50/50 dark:bg-slate-800/30">
            <div className="mx-auto w-16 h-16 bg-slate-100 dark:bg-slate-700 rounded-full flex items-center justify-center text-slate-300 dark:text-slate-500 mb-4">
              <Search size={32}/>
            </div>
            <p className="text-slate-500 dark:text-slate-400 font-medium">Nenhum resultado encontrado.</p>
            {activeFilter !== 'all' && <p className="text-slate-400 dark:text-slate-500 text-sm mt-1">Tente limpar os filtros para ver todos.</p>}
          </div>
        )}
      </div>

      <ClientModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initialData={selectedClient} />
      <ClientDetailsModal isOpen={historyOpen} onClose={() => setHistoryOpen(false)} client={selectedClient} onUpdate={loadData} />

      {/* Modal Delete */}
      {clientToDelete && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-slate-900/60 backdrop-blur-sm p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-900 p-6 rounded-2xl shadow-2xl max-w-sm w-full border border-slate-100 dark:border-slate-800">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-500 rounded-full flex items-center justify-center mb-4 mx-auto">
              <Trash2 size={24} />
            </div>
            <h3 className="text-lg font-bold text-slate-900 dark:text-white text-center mb-2">Excluir Cliente?</h3>
            <p className="text-sm text-slate-500 dark:text-slate-400 text-center mb-6">
              Você tem certeza que deseja remover <strong>{clientToDelete.company_name}</strong>?
            </p>
            <div className="flex gap-3">
              <button onClick={() => setClientToDelete(null)} className="flex-1 px-4 py-2.5 bg-slate-100 dark:bg-slate-800 hover:bg-slate-200 dark:hover:bg-slate-700 text-slate-700 dark:text-slate-300 font-bold rounded-xl transition">Cancelar</button>
              <button onClick={executeDelete} disabled={isDeleting} className="flex-1 px-4 py-2.5 bg-red-600 hover:bg-red-700 text-white font-bold rounded-xl transition shadow-lg shadow-red-200 dark:shadow-none">{isDeleting ? "..." : "Sim, Excluir"}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}