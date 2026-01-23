// ... (mantenha os imports iguais) ...
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { BidModal } from '../components/BidModal'
import { Plus, Calendar, DollarSign, AlertTriangle } from 'lucide-react'
import { formatCurrency, skeletonClass } from '../utils/formatters'
import { format, differenceInCalendarDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { createPortal } from 'react-dom'
import { DndContext, useDraggable, useDroppable, DragOverlay, useSensors, useSensor, PointerSensor, TouchSensor } from '@dnd-kit/core'

// --- ADAPTANDO AS CORES DAS COLUNAS PARA O MODO ESCURO ---
// Adicionamos classes dark:bg-slate-900, dark:border-slate-800, etc.
const COLUMNS = [
  { id: 'Triagem', title: 'Triagem', color: 'bg-slate-100 border-slate-200 dark:bg-slate-900/50 dark:border-slate-800' },
  { id: 'Em Análise', title: 'Em Análise', color: 'bg-blue-50 border-blue-100 dark:bg-blue-950/20 dark:border-blue-900/30' },
  { id: 'Disputa', title: 'Disputa', color: 'bg-amber-50 border-amber-100 dark:bg-amber-950/20 dark:border-amber-900/30' },
  { id: 'Aguardando', title: 'Aguardando', color: 'bg-purple-50 border-purple-100 dark:bg-purple-950/20 dark:border-purple-900/30' },
  { id: 'Ganha', title: 'Ganha 🎉', color: 'bg-emerald-50 border-emerald-100 dark:bg-emerald-950/20 dark:border-emerald-900/30' },
  { id: 'Perdida', title: 'Perdida', color: 'bg-red-50 border-red-100 dark:bg-red-950/20 dark:border-red-900/30' },
]

function BidCard({ bid, isOverlay, onClick }) {
  const today = new Date(); today.setHours(0,0,0,0)
  let daysToDeadline = 999, isUrgent = false, isLate = false

  if (bid.deadline) {
    const deadlineDate = new Date(bid.deadline + 'T00:00:00')
    daysToDeadline = differenceInCalendarDays(deadlineDate, today)
    isUrgent = daysToDeadline >= 0 && daysToDeadline <= 2 && !['Ganha', 'Perdida'].includes(bid.status)
    isLate = daysToDeadline < 0 && !['Ganha', 'Perdida'].includes(bid.status)
  }

  return (
    // CARD: bg-white -> dark:bg-slate-800 | border-slate-100 -> dark:border-slate-700
    <div 
      className={`p-3 rounded-xl shadow-sm border transition-all relative
        ${isOverlay ? 'bg-white dark:bg-slate-800 shadow-2xl scale-105 rotate-2 cursor-grabbing z-50' : 'bg-white dark:bg-slate-800 cursor-grab hover:shadow-md'}
        ${isUrgent ? 'border-red-400 ring-1 ring-red-100 dark:ring-red-900 shadow-red-100 dark:shadow-none' : 'border-slate-100 dark:border-slate-700'}
        ${isLate && !isOverlay ? 'opacity-60 bg-slate-50 dark:bg-slate-900 grayscale-[0.5]' : ''}
      `}
    >
      {isUrgent && (
        <div className="absolute top-0 right-0 bg-red-500 text-white text-[8px] font-extrabold px-2 py-1 rounded-bl-xl z-20 flex items-center gap-1 shadow-sm">
          <AlertTriangle size={8} className="fill-white animate-pulse"/> URGENTE
        </div>
      )}

      {!isOverlay && (
        <button 
          onPointerDown={(e) => { e.stopPropagation(); onClick?.() }}
          className="absolute top-1 left-1 opacity-0 hover:opacity-100 transition p-1 hover:bg-blue-50 dark:hover:bg-slate-700 rounded text-blue-500 dark:text-blue-400 z-30"
        >
          ✎
        </button>
      )}

      <div className="mt-3 select-none">
        <div className="text-[9px] font-bold text-slate-400 mb-0.5 uppercase tracking-tight truncate pr-2">
          {bid.clients?.company_name}
        </div>
        <h4 className="font-bold text-slate-800 dark:text-slate-100 text-xs leading-snug mb-2 break-words line-clamp-3">
          {bid.title}
        </h4>
      </div>
      
      <div className="space-y-1 border-t border-slate-50 dark:border-slate-700 pt-1.5 select-none">
        {bid.value && (
          <div className="flex items-center gap-1.5 text-[10px] text-slate-600 dark:text-slate-400 font-medium truncate">
            <DollarSign size={12} className="text-emerald-500 shrink-0"/> {formatCurrency(bid.value)}
          </div>
        )}
        {bid.deadline && (
          <div className={`flex items-center gap-1.5 text-[10px] font-medium rounded-md py-0.5 w-full truncate
            ${isUrgent ? 'text-red-600 dark:text-red-400' : isLate ? 'text-slate-400 line-through decoration-red-400' : 'text-slate-500 dark:text-slate-400'}
          `}>
            <Calendar size={12} className="shrink-0"/> 
            {format(new Date(bid.deadline + 'T00:00:00'), "dd/MM/yy", {locale: ptBR})}
            {isUrgent && <span className="text-[9px] ml-1 font-bold truncate">({daysToDeadline === 0 ? 'HOJE' : `${daysToDeadline}d`})</span>}
          </div>
        )}
      </div>
    </div>
  )
}

function DraggableBid({ bid, onClick }) {
  const { attributes, listeners, setNodeRef, isDragging } = useDraggable({ id: bid.id, data: bid })

  if (isDragging) {
    return <div ref={setNodeRef} className="opacity-30 grayscale border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-xl h-24 bg-slate-50 dark:bg-slate-800" />
  }

  return <div ref={setNodeRef} {...listeners} {...attributes} className="touch-none"><BidCard bid={bid} onClick={onClick} /></div>
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

  const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }), useSensor(TouchSensor, { activationConstraint: { delay: 150, tolerance: 5 } }))

  useEffect(() => { loadBids() }, [])

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

  return (
    <DndContext sensors={sensors} onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <div className="h-full flex flex-col animate-fade-in overflow-hidden">
        
        {/* Header */}
        <div className="flex justify-between items-center mb-4 px-1 shrink-0">
          <div>
            <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Funil de Licitações</h1>
            <p className="text-slate-500 dark:text-slate-400 text-sm">Arraste os cards para mudar de fase</p>
          </div>
          <button 
            onClick={() => { setSelectedBid(null); setModalOpen(true) }} 
            className="bg-brand-green hover:bg-brand-light text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-sm transition hover:-translate-y-0.5"
          >
            <Plus size={20}/> Nova Oportunidade
          </button>
        </div>

        {/* Board */}
        <div className="flex-1 overflow-hidden pb-2">
          <div className="flex gap-3 h-full w-full"> 
            {COLUMNS.map(col => {
              const colBids = bids.filter(b => b.status === col.id)
              const totalValue = colBids.reduce((acc, curr) => acc + (Number(curr.value) || 0), 0)

              return (
                <div key={col.id} className={`flex-1 min-w-0 flex flex-col rounded-2xl border ${col.color} p-2 h-full transition-colors`}>
                  <div className="flex justify-between items-center mb-2 px-1 shrink-0">
                    <h3 className="font-bold text-slate-700 dark:text-slate-300 text-[10px] md:text-xs uppercase tracking-wider flex items-center gap-2 truncate">
                      {col.title} 
                      <span className="bg-white/60 dark:bg-slate-800/60 px-1.5 py-0.5 rounded-full text-slate-500 dark:text-slate-400 text-[10px]">{colBids.length}</span>
                    </h3>
                  </div>

                  <DroppableColumn id={col.id} className="flex-1 overflow-y-auto overflow-x-hidden pr-1 space-y-2 custom-scrollbar">
                    {loading ? (
                      [...Array(3)].map((_, i) => <div key={i} className={`h-24 ${skeletonClass} dark:bg-slate-800`}/>)
                    ) : (
                      <>
                        {colBids.map(bid => (
                          <DraggableBid key={bid.id} bid={bid} onClick={() => { setSelectedBid(bid); setModalOpen(true) }} />
                        ))}
                        {colBids.length === 0 && <div className="h-full min-h-[100px] flex items-center justify-center text-slate-300 dark:text-slate-700 text-[10px] uppercase font-bold border-2 border-dashed border-slate-200/50 dark:border-slate-700 rounded-xl transition-colors hover:bg-white/40 dark:hover:bg-slate-800/40">Arraste aqui</div>}
                      </>
                    )}
                  </DroppableColumn>

                  {totalValue > 0 && (
                      <div className="mt-2 pt-2 border-t border-slate-200/50 dark:border-slate-700/50 text-right shrink-0">
                        <p className="text-[9px] font-bold text-slate-400 dark:text-slate-500 uppercase truncate">Total</p>
                        <p className="text-xs font-bold text-slate-700 dark:text-slate-300 tracking-tight truncate">{formatCurrency(totalValue)}</p>
                      </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>

        <BidModal isOpen={modalOpen} onClose={() => setModalOpen(false)} onSave={handleSave} initialData={selectedBid} />

        {createPortal(
          <DragOverlay>
            {activeBid ? (
              <div className="w-[280px]"> 
                <BidCard bid={activeBid} isOverlay />
              </div>
            ) : null}
          </DragOverlay>,
          document.body
        )}
      </div>
    </DndContext>
  )
}