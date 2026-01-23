import { X, Send, FileText, MessageSquare, Calendar, Clock, Download, Trash2, Loader2, Plus } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import { api } from '../services/api'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function ClientDetailsModal({ isOpen, onClose, client, onUpdate }) {
  const [activeTab, setActiveTab] = useState('history') // 'history' ou 'docs'
  
  // Estados de Histórico
  const [newHistory, setNewHistory] = useState('')
  const [histories, setHistories] = useState([])
  
  // Estados de Documentos
  const [documents, setDocuments] = useState([])
  const [newDoc, setNewDoc] = useState({ title: '', expiration_date: '' })
  
  // Loadings
  const [loading, setLoading] = useState(false)
  const [sending, setSending] = useState(false)
  const [addingDoc, setAddingDoc] = useState(false)

  const scrollRef = useRef(null)

  useEffect(() => {
    if (isOpen && client) {
      loadData()
    }
  }, [isOpen, client])

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight
    }
  }, [histories, activeTab])

  async function loadData() {
    setLoading(true)
    try {
      // Carrega Histórico
      const historyData = await api.getClientHistory(client.id)
      setHistories(historyData || [])

      // Carrega Documentos atualizados do Banco
      const docsData = await api.getDocuments(client.id)
      setDocuments(docsData || [])
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar detalhes.")
    } finally {
      setLoading(false)
    }
  }

  async function handleSendHistory(e) {
    e.preventDefault()
    if (!newHistory.trim()) return

    setSending(true)
    try {
      // 1. Envia e RECEBE o novo registro (newItem)
      const newItem = await api.addClientHistory(client.id, newHistory)
      
      // 2. ATUALIZAÇÃO OTIMISTA (Instantânea):
      // Adiciona o item novo no final da lista atual sem buscar no banco de novo
      setHistories(prev => [...prev, newItem])
      
      setNewHistory('')
      
      // 3. Avisa o Dashboard para atualizar a data de "Último Contato" lá atrás
      // Pequeno delay para garantir que o Gatilho do banco já rodou
      if (onUpdate) {
        setTimeout(() => {
          onUpdate()
        }, 500) 
      }

      toast.success("Histórico registrado!")
      
      // Força o scroll para baixo
      if (scrollRef.current) {
        setTimeout(() => {
          scrollRef.current.scrollTop = scrollRef.current.scrollHeight
        }, 100)
      }

    } catch (error) {
      console.error(error)
      toast.error("Erro ao salvar histórico.")
    } finally {
      setSending(false)
    }
  }

  // ...

  // --- AÇÕES DE DOCUMENTOS (NOVO) ---
  async function handleAddDocument(e) {
    e.preventDefault()
    if (!newDoc.title || !newDoc.expiration_date) {
      return toast.warning("Preencha nome e validade.")
    }
    setAddingDoc(true)
    try {
      await api.addDocument({
        client_id: client.id,
        title: newDoc.title,
        expiration_date: newDoc.expiration_date
      })
      toast.success("Documento adicionado!")
      setNewDoc({ title: '', expiration_date: '' }) // Limpa formulário
      loadData() // Recarrega lista
      onUpdate() // Atualiza dashboard (contadores)
    } catch (error) {
      toast.error("Erro ao adicionar documento.")
    } finally {
      setAddingDoc(false)
    }
  }

  async function handleDeleteDoc(docId) {
    if(!window.confirm("Excluir este documento permanentemente?")) return
    try {
      await api.deleteDocument(docId)
      toast.success("Documento removido.")
      loadData()
      onUpdate()
    } catch (error) {
      toast.error("Erro ao excluir.")
    }
  }

  if (!isOpen || !client) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl h-[650px] flex flex-col overflow-hidden border border-slate-100 dark:border-slate-800 transition-colors">
        
        {/* HEADER */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 bg-white dark:bg-slate-900 flex justify-between items-center shrink-0">
          <div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white uppercase tracking-tight truncate max-w-md">
              {client.company_name}
            </h2>
            <div className="flex gap-4 mt-2">
              <button 
                onClick={() => setActiveTab('history')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'history' 
                    ? 'border-brand-green text-brand-green dark:text-brand-light' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <MessageSquare size={14}/> Histórico
              </button>
              <button 
                onClick={() => setActiveTab('docs')}
                className={`text-xs font-bold uppercase tracking-wider pb-1 border-b-2 transition-colors flex items-center gap-1.5 ${
                  activeTab === 'docs' 
                    ? 'border-brand-green text-brand-green dark:text-brand-light' 
                    : 'border-transparent text-slate-400 hover:text-slate-600 dark:hover:text-slate-300'
                }`}
              >
                <FileText size={14}/> Documentos & Certidões
              </button>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full text-slate-400 transition">
            <X size={20} />
          </button>
        </div>

        {/* CONTEÚDO PRINCIPAL */}
        <div className="flex-1 overflow-y-auto custom-scrollbar bg-slate-50 dark:bg-slate-950/50 p-6 relative" ref={scrollRef}>
          
          {loading ? (
             <div className="flex items-center justify-center h-full text-slate-400 gap-2">
               <Loader2 className="animate-spin"/> Carregando...
             </div>
          ) : activeTab === 'history' ? (
            
            // --- ABA HISTÓRICO ---
            <div className="space-y-4">
              {histories.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-slate-400 py-10 opacity-60">
                  <MessageSquare size={48} className="mb-2 stroke-1"/>
                  <p>Nenhuma interação registrada.</p>
                </div>
              ) : (
                histories.map((item) => (
                  <div key={item.id} className="flex gap-3 animate-fade-in">
                    <div className="mt-1 w-8 h-8 rounded-full bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 flex items-center justify-center shrink-0 text-slate-500 text-xs font-bold">
                       <MessageSquare size={14}/>
                    </div>
                    <div className="flex-1">
                       <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs font-bold text-slate-700 dark:text-slate-300">Anotação</span>
                          <span className="text-[10px] text-slate-400 flex items-center gap-1">
                             <Clock size={10}/> {format(new Date(item.created_at), "dd/MM/yyyy 'às' HH:mm", {locale: ptBR})}
                          </span>
                       </div>
                       <div className="bg-white dark:bg-slate-800 p-3 rounded-xl rounded-tl-none border border-slate-200 dark:border-slate-700 text-sm text-slate-700 dark:text-slate-200 shadow-sm whitespace-pre-wrap">
                          {item.content}
                       </div>
                    </div>
                  </div>
                ))
              )}
            </div>

          ) : (
            
            // --- ABA DOCUMENTOS (AGORA COM FORMULÁRIO DE ADIÇÃO) ---
            <div className="space-y-6 animate-fade-in">
              
              {/* Formulário de Adição Rápida */}
              <form onSubmit={handleAddDocument} className="bg-white dark:bg-slate-800 p-4 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
                 <h4 className="text-sm font-bold text-brand-green dark:text-brand-light mb-3 flex items-center gap-2">
                   <Plus size={16}/> Novo Documento
                 </h4>
                 <div className="grid grid-cols-1 sm:grid-cols-5 gap-3 items-end">
                    <div className="sm:col-span-3">
                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Nome do Documento</label>
                       <input 
                         className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green"
                         placeholder="Ex: CND Federal..."
                         value={newDoc.title}
                         onChange={e => setNewDoc({...newDoc, title: e.target.value})}
                       />
                    </div>
                    <div className="sm:col-span-2">
                       <label className="text-[10px] uppercase font-bold text-slate-400 mb-1 block">Validade</label>
                       <input 
                         type="date"
                         className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-300 dark:border-slate-600 rounded-lg px-3 py-2 text-sm text-slate-700 dark:text-slate-200 focus:outline-none focus:ring-2 focus:ring-brand-green"
                         value={newDoc.expiration_date}
                         onChange={e => setNewDoc({...newDoc, expiration_date: e.target.value})}
                       />
                    </div>
                 </div>
                 <button 
                   type="submit"
                   disabled={addingDoc}
                   className="w-full mt-3 bg-brand-green hover:bg-brand-light text-white font-bold py-2 rounded-lg text-sm transition shadow-sm flex items-center justify-center gap-2"
                 >
                   {addingDoc ? <Loader2 size={16} className="animate-spin"/> : <Plus size={16}/>}
                   Adicionar Documento
                 </button>
              </form>

              {/* Lista de Documentos */}
              <div className="space-y-3">
                 <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">
                   Documentos Atuais ({documents.length})
                 </h4>
                 
                 {documents.length === 0 ? (
                   <div className="flex flex-col items-center justify-center py-8 text-slate-400 border-2 border-dashed border-slate-200 dark:border-slate-800 rounded-xl">
                     <FileText size={32} className="mb-2 opacity-50"/>
                     <p className="text-sm">Nenhum documento cadastrado.</p>
                   </div>
                 ) : (
                   documents.map(doc => {
                     const today = new Date().toISOString().split('T')[0]
                     const isExpired = doc.expiration_date < today
                     return (
                       <div key={doc.id} className="flex items-center justify-between p-3 bg-white dark:bg-slate-800 border border-slate-100 dark:border-slate-700 rounded-xl hover:shadow-md transition">
                          <div className="flex items-center gap-3">
                             <div className={`p-2 rounded-lg ${isExpired ? 'bg-red-50 text-red-500' : 'bg-blue-50 text-brand-green'}`}>
                               <FileText size={18}/>
                             </div>
                             <div>
                               <p className="text-sm font-bold text-slate-700 dark:text-white">{doc.title}</p>
                               <p className={`text-xs flex items-center gap-1 ${isExpired ? 'text-red-500 font-bold' : 'text-slate-500 dark:text-slate-400'}`}>
                                 <Calendar size={10}/> Vence: {format(new Date(doc.expiration_date + 'T00:00:00'), 'dd/MM/yyyy')}
                                 {isExpired && '(VENCIDO)'}
                               </p>
                             </div>
                          </div>
                          <div className="flex gap-1">
                            <button className="p-2 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg text-slate-400 hover:text-brand-green transition" title="Baixar (Simulado)">
                               <Download size={18}/>
                            </button>
                            <button 
                              onClick={() => handleDeleteDoc(doc.id)}
                              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 text-slate-400 hover:text-red-500 rounded-lg transition"
                              title="Excluir"
                            >
                              <Trash2 size={18}/>
                            </button>
                          </div>
                       </div>
                     )
                   })
                 )}
              </div>
            </div>
          )}
        </div>

        {/* INPUT DE HISTÓRICO (Só aparece na aba Histórico) */}
        {activeTab === 'history' && (
          <form onSubmit={handleSendHistory} className="p-4 bg-white dark:bg-slate-900 border-t border-slate-100 dark:border-slate-800 flex gap-3 shrink-0">
            <input 
              className="flex-1 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 text-sm text-slate-800 dark:text-slate-100 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-brand-green transition"
              placeholder="Digite uma nova anotação..."
              value={newHistory}
              onChange={(e) => setNewHistory(e.target.value)}
            />
            <button 
              type="submit" 
              disabled={sending || !newHistory.trim()}
              className="bg-brand-green hover:bg-brand-light disabled:opacity-50 text-white p-3 rounded-xl transition shadow-lg shadow-brand-green/20 flex items-center justify-center aspect-square"
            >
              {sending ? <Loader2 className="animate-spin" size={20}/> : <Send size={20}/>}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}