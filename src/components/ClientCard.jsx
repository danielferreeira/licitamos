import { Phone, MapPin, Calendar, Eye, Edit, Trash2 } from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { maskPhone } from '../utils/formatters' // Importando formatador se tiver

export function ClientCard({ client, onOpenDetails, onEdit, onDelete }) {
  const statusColors = {
    'Cliente': 'bg-emerald-100 text-emerald-700 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-400 dark:border-emerald-800',
    'Em Negociação': 'bg-amber-100 text-amber-700 border-amber-200 dark:bg-amber-900/30 dark:text-amber-400 dark:border-amber-800',
    'Prospect': 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800',
    'Inativo': 'bg-slate-100 text-slate-500 border-slate-200 dark:bg-slate-800 dark:text-slate-400 dark:border-slate-700'
  }

  // CORREÇÃO AQUI: Usando 'last_contact' em vez de 'last_contact_date'
  const lastContactDate = client.last_contact 
    ? format(new Date(client.last_contact), "dd MMM", { locale: ptBR })
    : 'Nunca'

  return (
    <div className="group bg-white dark:bg-slate-800 rounded-2xl p-5 border border-slate-200 dark:border-slate-700 hover:border-blue-300 dark:hover:border-blue-500 hover:shadow-lg transition-all duration-300 flex flex-col justify-between h-full relative">
      <div>
        <div className="flex justify-between items-start mb-3">
          <div className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider border ${statusColors[client.status] || statusColors['Prospect']}`}>
            {client.status}
          </div>
          
          <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
            <button onClick={(e) => { e.stopPropagation(); onEdit(client) }} className="p-1.5 text-slate-400 hover:text-brand-green hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded-lg"><Edit size={16} /></button>
            <button onClick={(e) => { e.stopPropagation(); onDelete(client.id) }} className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded-lg"><Trash2 size={16} /></button>
          </div>
        </div>

        <h3 className="text-lg font-bold text-slate-800 dark:text-white mb-1 leading-tight truncate" title={client.company_name}>
          {client.company_name}
        </h3>
        <p className="text-sm text-slate-500 dark:text-slate-400 mb-4 truncate">
          {client.contact_person || 'Sem contato principal'}
        </p>

        <div className="space-y-2 text-xs text-slate-500 dark:text-slate-400">
          {client.phone && (
            <div className="flex items-center gap-2">
              <Phone size={14} className="text-slate-400 shrink-0"/> {maskPhone(client.phone)}
            </div>
          )}
          {(client.city || client.state) && (
            <div className="flex items-center gap-2">
              <MapPin size={14} className="text-slate-400 shrink-0"/> {client.city}/{client.state}
            </div>
          )}
        </div>
      </div>

      <div className="mt-5 pt-4 border-t border-slate-50 dark:border-slate-700 flex items-center justify-between">
        <div className="text-xs text-slate-400 dark:text-slate-500">
          <span className="block mb-0.5 uppercase font-bold text-[10px]">Último contato:</span>
          <span className={`flex items-center gap-1 font-semibold ${client.last_contact ? 'text-slate-600 dark:text-slate-300' : 'text-slate-400'}`}>
            <Calendar size={12}/>
            {lastContactDate}
          </span>
        </div>
        <button 
          onClick={() => onOpenDetails(client)}
          className="bg-slate-900 dark:bg-slate-700 text-white p-2 rounded-xl hover:bg-brand-green dark:hover:bg-slate-600 transition-colors shadow-sm"
        >
          <Eye size={18} />
        </button>
      </div>
    </div>
  )
}