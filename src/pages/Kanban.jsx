import { useState, useEffect, useRef } from 'react' 
import { api } from '../services/api'
import { BidModal } from '../components/BidModal'
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal' // <--- IMPORTADO
import { Plus, Calendar, DollarSign, AlertTriangle, Kanban as KanbanIcon, History, Search, MoreVertical, Trash2, Edit } from 'lucide-react'
import { formatCurrency, skeletonClass } from '../utils/formatters'
import { format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensors, useSensor, PointerSensor, TouchSensor } from '@dnd-kit/core'

const COLUMNS = [
  { id: 'Triagem', title: 'Triagem', color: 'bg-slate-100 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800' },
  { id: 'Em Análise', title: 'Em Análise', color: 'bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30' },
  { id: 'Disputa', title: 'Disputa', color: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30' },
  { id: 'Aguardando', title: 'Aguardando', color: 'bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30' },
  { id: 'Ganha', title: 'Ganha 🎉', color: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' },
  { id: 'Perdida', title: 'Perdida', color: 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30' },
]

function BidCard({ bid, isOverlay, onClick, onDelete }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)
  
  const today = new Date(); today.setHours(0,0,0,0)
  let daysToDeadline = 999, isUrgent = false

  if (bid.deadline) {
    const deadlineDate = new Date(bid.deadline + 'T00:00:00')
    daysToDeadline = differenceInCalendarDays(deadlineDate, today)
    isUrgent = daysToDeadline >= 0 && daysToDeadline <= 1 && !['Ganha', 'Perdida'].includes(bid.status)
  }

  useEffect(() => {
    function handleClickOutside(event) {
      if (
        showMenu && 
        menuRef.current && 
        !menuRef.current.contains(event.target) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target)
      ) {
        setShowMenu(false)
      }
    }
    document.addEventListener("mousedown", handleClickOutside)
    return () => { document.removeEventListener("mousedown", handleClickOutside) }
  }, [showMenu])

  return (
    <div className={`p-3 rounded-xl shadow-sm border transition-all relative group bg-white dark:bg-slate-800 ${isUrgent ? 'border-red-400 ring-1 ring-red-100 dark:ring-red-900' : 'border-slate-100 dark:border-slate-700'}`}>
      
      {!isOverlay && (
        <div className="absolute top-2 right-2 z-20">
          <button 
            ref={buttonRef} 
            onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
            className="p-1 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded opacity-0 group-hover:opacity-100 transition-opacity"
          >
            <MoreVertical size={16}/>
          </button>
          
          {showMenu && (
            <div 
              ref={menuRef} 
              className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-lg shadow-xl overflow-hidden animate-fade-in flex flex-col z-30"
            >
              <button 
                onClick={(e) => { e.stopPropagation(); setShowMenu(false); onClick?.() }}
                className="px-3 py-2 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 w-full"
              >
                <Edit size={12}/> Editar
              </button>
              <button 
                onClick={(e) => { 
                    e.stopPropagation(); 
                    setShowMenu(false); 
                    if(onDelete) onDelete(); 
                }}
                className="px-3 py-2 text-xs text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 w-full"
              >
                <Trash2 size={12}/> Excluir
              </button>
            </div>
          )}
        </div>
      )}

      <div className="mt-1 select-none">
        <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-tight truncate pr-6">
          {bid.clients?.company_name || 'Sem Cliente'}
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug mb-2 break-words line-clamp-3">
          {bid.title}
        </h4>
      </div>
      
      <div className="space-y-1 border-t border-slate-50 dark:border-slate-700 pt-1.5 select-none">
        {bid.value > 0 && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
            <DollarSign size={12} className="text-emerald-500 shrink-0"/> {formatCurrency(bid.value)}
          </div>
        )}
        {bid.deadline && (
          <div className={`flex items-center gap-1.5 text-[10px] font-medium rounded-md py-0.5 w-full truncate ${isUrgent ? 'text-red-600 dark:text-red-400' : 'text-slate-500 dark:text-slate-400'}`}>
            <Calendar size={12} className="shrink-0"/> {format(new Date(bid.deadline + 'T00:00:00'), "dd/MM/yy", {locale: ptBR})}
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableBid({ bid, onClick, onDelete }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: bid.id, data: bid })
  
  if (isDragging) {
    return <div ref={setNodeRef} className="opacity-30 grayscale border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl h-24 bg-slate-50 dark:bg-slate-800" />
  }

  return (
    <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none">
        <BidCard bid={bid} onClick={onClick} onDelete={onDelete} />
    </div>
  )
}

function DroppableColumn({ id, children, className }) {
  const { setNodeRef } = useDroppable({ id })
  return <div ref={setNodeRef} className={className}>{children}</div>
}

export function Kanban() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(false)
  const [selectedBid, setSelectedBid] = useState(null)
  const [activeBid, setActiveBid] = useState(null)
  
  // --- ESTADOS DO MODAL DE EXCLUSÃO ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [bidToDelete, setBidToDelete] = useState(null)
  // ------------------------------------

  const [activeTab, setActiveTab] = useState('board')
  const [searchTerm, setSearchTerm] = useState('')

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }))

  useEffect(() => { loadBids() }, [])

  // 1. Função chamada ao clicar na lixeira (SÓ ABRE O MODAL)
  function handleDeleteRequest(bidId) {
    const bid = bids.find(b => b.id === bidId)
    setBidToDelete(bid)
    setDeleteModalOpen(true)
  }

  // 2. Função chamada ao confirmar no modal (EXECUTA A AÇÃO)
  async function confirmDelete() {
    if (!bidToDelete) return
    try {
      await api.deleteBid(bidToDelete.id)
      toast.success("Licitação removida.")
      loadBids()
      setDeleteModalOpen(false)
      setBidToDelete(null)
    } catch (e) { 
      toast.error("Erro ao excluir.") 
    }
  }

  async function loadBids() {
    setLoading(true)
    try {
      const data = await api.getBids()
      setBids(data || [])
    } catch (error) { toast.error("Erro ao carregar") } 
    finally { setLoading(false) }
  }

  async function handleSave(bid) {
    await api.saveBid(bid)
    loadBids()
  }

  function handleDragStart(event) { setActiveBid(event.active.data.current) }

  async function handleDragEnd(event) {
    const { active, over } = event
    setActiveBid(null)
    if (!over) return
    const bidId = active.id
    const newStatus = over.id
    const currentBid = bids.find(b => b.id === bidId)
    if (currentBid && currentBid.status !== newStatus) {
      setBids(prev => prev.map(b => b.id === bidId ? { ...b, status: newStatus } : b))
      try {
        await api.updateBidStatus(bidId, newStatus)
        toast.success(`Movido para ${newStatus}`)
      } catch (error) {
        toast.error("Erro ao mover card")
        loadBids()
      }
    }
  }

  const today = new Date(); today.setHours(0,0,0,0)
  const isActiveDate = (bid) => { if (!bid.deadline) return true; return differenceInCalendarDays(new Date(bid.deadline + 'T00:00:00'), today) >= 0 }
  
  const boardBids = bids.filter(bid => isActiveDate(bid))
  const historyBids = bids.filter(bid => {
    const isPast = !isActiveDate(bid)
    const matchesSearch = bid.title.toLowerCase().includes(searchTerm.toLowerCase()) || bid.clients?.company_name?.toLowerCase().includes(searchTerm.toLowerCase())
    return isPast && matchesSearch
  })

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col animate-fade-in overflow-hidden">
        
        {/* HEADER */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 px-1 shrink-0 gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Gestão de Licitações</h1>
            <p className="text-slate-500 dark:text-slate-400 mb-8">Organize suas disputas e resultados.</p>
          </div>
          <div className="flex bg-white dark:bg-slate-800 p-1 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm">
             <button onClick={() => setActiveTab('board')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'board' ? 'bg-brand-green text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><KanbanIcon size={16}/> Funil Ativo ({boardBids.length})</button>
             <button onClick={() => setActiveTab('history')} className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'history' ? 'bg-brand-green text-white shadow-md' : 'text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-700'}`}><History size={16}/> Histórico ({historyBids.length})</button>
          </div>
          <button onClick={() => { setSelectedBid(null); setModalOpen(true) }} className="bg-brand-green hover:bg-brand-light text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition hover:-translate-y-0.5"><Plus size={20}/> Nova Oportunidade</button>
        </div>

        {/* --- VIEW: BOARD --- */}
        {activeTab === 'board' && (
          <div className="flex-1 overflow-x-auto overflow-y-hidden pb-4 custom-scrollbar">
            <div className="flex gap-4 h-full min-w-full w-max px-2"> 
              {COLUMNS.map(col => {
                const colBids = boardBids.filter(b => b.status === col.id)
                const totalValue = colBids.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)
                return (
                  <div key={col.id} className={`w-80 flex-shrink-0 flex flex-col rounded-2xl border ${col.color} p-2 h-full transition-colors`}>
                    <div className="flex justify-between items-center mb-2 px-1 shrink-0"><h3 className="font-bold text-slate-700 dark:text-slate-300 text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-2 truncate">{col.title} <span className="bg-white/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 text-[10px]">{colBids.length}</span></h3></div>
                    <DroppableColumn id={col.id} className="flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-2 custom-scrollbar">
                      {loading ? [...Array(3)].map((_, i) => <div key={i} className={`h-24 ${skeletonClass} dark:bg-slate-800`}/>) : (
                        <>
                          {colBids.map(bid => (
                            <DraggableBid 
                              key={bid.id} 
                              bid={bid} 
                              onClick={() => { setSelectedBid(bid); setModalOpen(true) }} 
                              onDelete={() => handleDeleteRequest(bid.id)} // <--- Alterado aqui
                            />
                          ))}
                          {colBids.length === 0 && <div className="h-full min-h-[100px] flex items-center justify-center text-slate-300 dark:text-slate-700 text-[10px] uppercase font-bold border-2 border-dashed border-slate-200/50 dark:border-slate-700 rounded-xl transition-colors hover:bg-white/40 dark:hover:bg-slate-800/40">Vazio</div>}
                        </>
                      )}
                    </DroppableColumn>
                    {totalValue > 0 && (<div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-right shrink-0"><p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">Total</p><p className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight truncate">{formatCurrency(totalValue)}</p></div>)}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* --- VIEW: HISTÓRICO --- */}
        {activeTab === 'history' && (
          <div className="flex-1 bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden animate-fade-in">
             <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex items-center gap-3"><Search className="text-slate-400" size={20}/><input className="flex-1 bg-transparent outline-none text-slate-700 dark:text-slate-200 placeholder:text-slate-400" placeholder="Buscar no histórico..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)} /></div>
             <div className="flex-1 overflow-y-auto custom-scrollbar p-0">
                <table className="w-full text-left border-collapse">
                  <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                    <tr>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Objeto</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Valor</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                      <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                    {historyBids.length === 0 ? (
                      <tr><td colSpan="6" className="p-10 text-center text-slate-400">Nenhum histórico encontrado.</td></tr>
                    ) : (
                      historyBids.map(bid => (
                        <tr key={bid.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition group">
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{bid.deadline ? format(new Date(bid.deadline + 'T00:00:00'), 'dd/MM/yyyy') : '-'}</td>
                          <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200">{bid.clients?.company_name}</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate" title={bid.title}>{bid.title}</td>
                          <td className="p-4 text-sm text-slate-600 dark:text-slate-300">{formatCurrency(bid.value)}</td>
                          <td className="p-4">
                            <span className={`px-2 py-1 rounded-full text-xs font-bold ${
                              bid.status === 'Ganha' ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400' : 
                              bid.status === 'Perdida' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300'
                            }`}>{bid.status}</span>
                          </td>
                          <td className="p-4 text-right">
                            <div className="flex items-center justify-end gap-2 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity">
                              <button onClick={() => { setSelectedBid(bid); setModalOpen(true) }} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg transition" title="Editar"><Edit size={16}/></button>
                              <button onClick={() => handleDeleteRequest(bid.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg transition" title="Excluir"><Trash2 size={16}/></button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
             </div>
          </div>
        )}
        
        <BidModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initialData={selectedBid} />
        {activeTab === 'board' && createPortal(<DragOverlay>{activeBid ? <div className="w-[280px]"><BidCard bid={activeBid} isOverlay /></div> : null}</DragOverlay>, document.body)}

        {/* --- MODAL DE EXCLUSÃO RENDERIZADO AQUI --- */}
        <DeleteConfirmationModal 
          isOpen={deleteModalOpen}
          onClose={() => setDeleteModalOpen(false)}
          onConfirm={confirmDelete}
          title="Excluir Licitação?"
          description={`Você tem certeza que deseja remover "${bidToDelete?.title}"? Esta ação não pode ser desfeita.`}
        />
        
      </div>
    </DndContext>
  )
}