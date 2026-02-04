import { useState, useEffect, useRef } from 'react' // Adicionado useRef
import { api, supabase } from '../services/api'
import { Calendar, Clock, Plus, ExternalLink, Video, MapPin, Trash2, X, AlertCircle, CheckCircle, History, Edit, Building2, MoreVertical } from 'lucide-react'
import { DeleteConfirmationModal } from '../components/DeleteConfirmationModal'
import { toast } from 'sonner'
import { format, parseISO, addHours } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export function Agenda() {
  const [events, setEvents] = useState([])
  const [clients, setClients] = useState([]) 
  const [loading, setLoading] = useState(true)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [editingEvent, setEditingEvent] = useState(null) 
  
  // --- ESTADOS DO MODAL DE EXCLUSÃO ---
  const [deleteModalOpen, setDeleteModalOpen] = useState(false)
  const [eventToDelete, setEventToDelete] = useState(null)
  // ------------------------------------

  const initialEventState = {
    title: '',
    description: '',
    event_date: format(new Date(), 'yyyy-MM-dd'),
    event_time: format(new Date(), 'HH:mm'), 
    event_type: 'reuniao',
    client_id: '' 
  }

  const [newEvent, setNewEvent] = useState(initialEventState)

  useEffect(() => {
    loadData()
  }, [])

  async function loadData() {
    try {
      setLoading(true)
      const [eventsData, clientsData] = await Promise.all([
        api.getEvents(),
        api.getClients()
      ])
      setEvents(eventsData || [])
      setClients(clientsData || [])
    } catch (error) {
      toast.error("Erro ao carregar dados.")
    } finally {
      setLoading(false)
    }
  }

  function openNewEventModal() {
    setEditingEvent(null)
    setNewEvent(initialEventState)
    setIsModalOpen(true)
  }

  function openEditModal(evt) {
    setEditingEvent(evt)
    setNewEvent({
      title: evt.title,
      description: evt.description || '',
      event_date: evt.event_date,
      event_time: evt.event_time,
      event_type: evt.event_type,
      client_id: evt.client_id || ''
    })
    setIsModalOpen(true)
  }

  async function handleSaveEvent(e) {
    e.preventDefault()
    if(!newEvent.title || !newEvent.event_date) return toast.warning("Preencha o título e a data.")

    try {
      if (editingEvent) {
        await api.updateEvent(editingEvent.id, newEvent)
        toast.success("Compromisso atualizado!")
      } else {
        await api.addEvent(newEvent)
        toast.success("Compromisso criado!")
      }

      setIsModalOpen(false)
      loadData() 
    } catch (error) {
      toast.error("Erro ao salvar.")
    }
  }

  // 1. Abertura do Modal de Exclusão
  function handleDeleteRequest(id) {
    const evt = events.find(e => e.id === id)
    setEventToDelete(evt)
    setDeleteModalOpen(true)
  }

  // 2. Confirmação de Exclusão
  async function confirmDelete() {
    if (!eventToDelete) return
    try {
      await api.deleteEvent(eventToDelete.id)
      toast.success("Compromisso removido.")
      loadData()
      setDeleteModalOpen(false)
      setEventToDelete(null)
    } catch (error) {
      toast.error("Erro ao excluir.")
    }
  }

  function addToGoogleCalendar(evt) {
    const title = encodeURIComponent(evt.title)
    const details = encodeURIComponent(evt.description || 'Agendado via Sistema Licitamos')
    
    const startDate = parseISO(`${evt.event_date}T${evt.event_time}`)
    const endDate = addHours(startDate, 1)

    const formatGoogle = (date) => date.toISOString().replace(/-|:|\.\d+/g, '')
    const dates = `${formatGoogle(startDate)}/${formatGoogle(endDate)}`
    
    const url = `https://calendar.google.com/calendar/render?action=TEMPLATE&text=${title}&dates=${dates}&details=${details}`
    window.open(url, '_blank')
  }

  const todayStr = format(new Date(), 'yyyy-MM-dd')

  const upcomingEvents = events.filter(e => {
    const eventDateStr = e.event_date.substring(0, 10) 
    return eventDateStr >= todayStr
  })

  const pastEvents = events.filter(e => {
    const eventDateStr = e.event_date.substring(0, 10)
    return eventDateStr < todayStr
  }).reverse()

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in">
      
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Agenda Corporativa</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Gerencie seus prazos e reuniões.</p>
        </div>
        <button 
          onClick={openNewEventModal}
          className="bg-brand-green hover:bg-brand-light text-white px-4 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-green/20 transition hover:-translate-y-0.5"
        >
          <Plus size={20}/> Novo Compromisso
        </button>
      </div>

      {/* ÁREA PRINCIPAL */}
      <h3 className="font-bold text-slate-700 dark:text-slate-300 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
        <Clock size={14}/> Próximos Eventos & Hoje
      </h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-12">
        {upcomingEvents.length === 0 && (
          <div className="col-span-full py-12 text-center border-2 border-dashed border-slate-200 dark:border-slate-700 rounded-2xl bg-slate-50/50 dark:bg-slate-900/50">
            <Calendar size={48} className="mx-auto text-slate-300 mb-3"/>
            <p className="text-slate-400 font-medium">
              {loading ? "Carregando..." : "Nenhum compromisso agendado."}
            </p>
          </div>
        )}

        {upcomingEvents.map(evt => (
          <EventCard key={evt.id} evt={evt} onDelete={handleDeleteRequest} onEdit={openEditModal} onGoogle={addToGoogleCalendar} />
        ))}
      </div>

      {/* HISTÓRICO */}
      {pastEvents.length > 0 && (
        <div className="border-t border-slate-200 dark:border-slate-700 pt-8">
          <h3 className="font-bold text-slate-500 dark:text-slate-400 mb-4 text-xs uppercase tracking-wider flex items-center gap-2">
            <History size={14}/> Histórico de Realizados
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {pastEvents.map(evt => (
              <EventCard key={evt.id} evt={evt} onDelete={handleDeleteRequest} onEdit={openEditModal} onGoogle={addToGoogleCalendar} isPast={true} />
            ))}
          </div>
        </div>
      )}

      {/* MODAL CRIAÇÃO/EDIÇÃO */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fade-in">
          <div className="bg-white dark:bg-slate-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden border border-slate-100 dark:border-slate-700">
            <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex justify-between items-center bg-slate-50 dark:bg-slate-900/50">
              <h3 className="font-bold text-slate-800 dark:text-white">
                {editingEvent ? 'Editar Compromisso' : 'Novo Agendamento'}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-slate-400 hover:text-red-500 transition"><X size={20}/></button>
            </div>
            
            <form onSubmit={handleSaveEvent} className="p-6 space-y-4">
              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Título</label>
                <input 
                  autoFocus
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green dark:text-white font-medium"
                  placeholder="Ex: Reunião de Alinhamento"
                  value={newEvent.title}
                  onChange={e => setNewEvent({...newEvent, title: e.target.value})}
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Vincular Cliente (Opcional)</label>
                <div className="relative">
                  <select 
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green dark:text-white appearance-none cursor-pointer"
                    value={newEvent.client_id}
                    onChange={e => setNewEvent({...newEvent, client_id: e.target.value})}
                  >
                    <option value="">-- Sem cliente vinculado --</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.company_name}</option>
                    ))}
                  </select>
                  <Building2 size={16} className="absolute right-4 top-3.5 text-slate-400 pointer-events-none"/>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Data</label>
                  <input 
                    type="date"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green dark:text-white"
                    value={newEvent.event_date}
                    onChange={e => setNewEvent({...newEvent, event_date: e.target.value})}
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Hora</label>
                  <input 
                    type="time"
                    className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green dark:text-white"
                    value={newEvent.event_time}
                    onChange={e => setNewEvent({...newEvent, event_time: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Tipo</label>
                <select 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green dark:text-white cursor-pointer"
                  value={newEvent.event_type}
                  onChange={e => setNewEvent({...newEvent, event_type: e.target.value})}
                >
                  <option value="reuniao">🎥 Reunião</option>
                  <option value="visita">📍 Visita Técnica</option>
                  <option value="prazo">⚠️ Prazo / Edital</option>
                  <option value="audiencia">⚖️ Audiência</option>
                  <option value="outro">📅 Outro</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-slate-500 uppercase mb-1.5 ml-1">Descrição</label>
                <textarea 
                  className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl px-4 py-3 outline-none focus:ring-2 focus:ring-brand-green dark:text-white resize-none h-24 custom-scrollbar"
                  placeholder="Detalhes..."
                  value={newEvent.description}
                  onChange={e => setNewEvent({...newEvent, description: e.target.value})}
                />
              </div>

              <button type="submit" className="w-full bg-brand-green hover:bg-brand-light text-white font-bold py-3.5 rounded-xl shadow-lg shadow-brand-green/20 transition mt-2 active:scale-[0.98]">
                {editingEvent ? 'Salvar Alterações' : 'Criar Compromisso'}
              </button>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE EXCLUSÃO --- */}
      <DeleteConfirmationModal 
        isOpen={deleteModalOpen}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={confirmDelete}
        title="Excluir Compromisso?"
        description={`Você tem certeza que deseja remover "${eventToDelete?.title}"?`}
      />

    </div>
  )
}

function EventCard({ evt, onDelete, onEdit, onGoogle, isPast }) {
  const [showMenu, setShowMenu] = useState(false)
  const menuRef = useRef(null)
  const buttonRef = useRef(null)

  const typeConfig = {
    'reuniao': { icon: <Video size={18}/>, color: 'bg-blue-50 text-blue-600 dark:bg-blue-900/30 dark:text-blue-400', label: 'Reunião' },
    'prazo':   { icon: <AlertCircle size={18}/>, color: 'bg-red-50 text-red-600 dark:bg-red-900/30 dark:text-red-400', label: 'Prazo' },
    'visita':  { icon: <MapPin size={18}/>, color: 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/30 dark:text-emerald-400', label: 'Visita' },
    'audiencia':{ icon: <Clock size={18}/>, color: 'bg-amber-50 text-amber-600 dark:bg-amber-900/30 dark:text-amber-400', label: 'Audiência' },
    'outro':   { icon: <Calendar size={18}/>, color: 'bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400', label: 'Evento' }
  }

  const config = typeConfig[evt.event_type] || typeConfig['outro']
  
  const todayStr = format(new Date(), 'yyyy-MM-dd')
  const isDayMatch = evt.event_date.substring(0, 10) === todayStr

  // Fechar menu ao clicar fora
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
    <div className={`bg-white dark:bg-slate-800 p-6 rounded-2xl border transition group relative flex flex-col justify-between h-full
      ${isDayMatch && !isPast
        ? 'border-brand-green ring-1 ring-brand-green shadow-lg shadow-brand-green/10' 
        : 'border-slate-100 dark:border-slate-700 shadow-sm hover:shadow-md'
      }
      ${isPast ? 'bg-slate-50/50 dark:bg-slate-800/50 opacity-80' : ''} 
    `}>
      
      {/* MENU DE AÇÕES PADRONIZADO */}
      <div className="absolute top-3 right-3 z-10">
        <button 
          ref={buttonRef}
          onClick={(e) => { e.stopPropagation(); setShowMenu(!showMenu) }}
          className="p-1.5 text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-700 rounded-lg transition-colors"
        >
          <MoreVertical size={18}/>
        </button>
        
        {showMenu && (
          <div 
            ref={menuRef} 
            className="absolute right-0 mt-1 w-28 bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl shadow-xl overflow-hidden animate-fade-in flex flex-col z-20"
          >
            <button 
              onClick={(e) => { e.stopPropagation(); setShowMenu(false); onEdit(evt) }}
              className="px-3 py-2.5 text-xs text-left hover:bg-slate-50 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 flex items-center gap-2 w-full font-medium"
            >
              <Edit size={14}/> Editar
            </button>
            <button 
              onClick={(e) => { 
                  e.stopPropagation(); 
                  setShowMenu(false); 
                  onDelete(evt.id); 
              }}
              className="px-3 py-2.5 text-xs text-left hover:bg-red-50 dark:hover:bg-red-900/20 text-red-600 flex items-center gap-2 w-full font-medium"
            >
              <Trash2 size={14}/> Excluir
            </button>
          </div>
        )}
      </div>

      <div>
        <div className="flex justify-between items-start mb-4 pr-10">
          <div className={`p-2.5 rounded-xl ${isPast ? 'bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400' : config.color} flex items-center gap-2`}>
            {isPast ? <CheckCircle size={18}/> : config.icon}
            <span className="text-[10px] font-extrabold uppercase tracking-wide">{isPast ? 'Concluído' : config.label}</span>
          </div>
        </div>
        
        <div className="mb-4">
          <span className={`text-xs font-bold uppercase tracking-wider block mb-0.5 ${isDayMatch && !isPast ? 'text-brand-green' : 'text-slate-400'}`}>
            {isDayMatch ? 'Hoje' : format(parseISO(evt.event_date), "dd 'de' MMMM", { locale: ptBR })}
          </span>
          <h3 className={`font-bold text-lg leading-tight mb-1 line-clamp-2 ${isPast ? 'text-slate-500 dark:text-slate-400 line-through decoration-slate-300' : 'text-slate-800 dark:text-white'}`}>
            {evt.title}
          </h3>
          
          <div className="flex flex-col gap-1 mt-2">
            <span className="text-sm font-semibold text-slate-500 dark:text-slate-400 flex items-center gap-1.5">
              <Clock size={14}/> {evt.event_time.slice(0, 5)}
            </span>
            {evt.clients && (
              <span className="text-xs font-bold text-brand-green flex items-center gap-1.5 truncate">
                <Building2 size={14}/> {evt.clients.company_name}
              </span>
            )}
          </div>
        </div>

        {evt.description && (
          <p className="text-sm text-slate-500 dark:text-slate-400 line-clamp-2 bg-slate-50 dark:bg-slate-900/50 p-2 rounded-lg border border-slate-100 dark:border-slate-700/50">
            {evt.description}
          </p>
        )}
      </div>

      {!isPast && (
        <button 
          onClick={() => onGoogle(evt)}
          className="w-full py-2.5 border border-slate-200 dark:border-slate-600 rounded-xl text-xs font-bold text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700 flex items-center justify-center gap-2 transition uppercase tracking-wide mt-auto pt-4"
        >
          <ExternalLink size={14}/> Adicionar ao Google
        </button>
      )}
    </div>
  )
}