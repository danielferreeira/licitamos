import { X, Loader2, Gavel, Calendar, DollarSign, ExternalLink } from 'lucide-react'
import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { toast } from 'sonner'

export function BidModal({ isOpen, onClose, onSave, initialData }) {
  // ... (estados e useEffects iguais) ...
  const [formData, setFormData] = useState({ title: '', client_id: '', status: 'Triagem', value: '', deadline: '', portal: '' })
  const [clients, setClients] = useState([])
  const [isSaving, setIsSaving] = useState(false)

  useEffect(() => { if (isOpen) api.getClients().then(data => setClients(data || [])) }, [isOpen])
  useEffect(() => { if (initialData) setFormData(initialData); else setFormData({ title: '', client_id: '', status: 'Triagem', value: '', deadline: '', portal: '' }) }, [initialData, isOpen])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)
    try { await onSave(formData); toast.success('Licitação salva!'); onClose() } catch (error) { toast.error('Erro ao salvar.') } finally { setIsSaving(false) }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      {/* Modal Container: Dark Mode colors */}
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-lg border border-slate-100 dark:border-slate-800 transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green/10 dark:bg-brand-green/20 rounded-xl flex items-center justify-center text-brand-green dark:text-brand-light">
               <Gavel size={20}/>
            </div>
            <h2 className="font-bold text-lg text-slate-800 dark:text-white">{initialData?.id ? 'Editar Licitação' : 'Nova Oportunidade'}</h2>
          </div>
          <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600 dark:text-slate-500 dark:hover:text-slate-300 transition"/></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          <div>
            <label className="label-title">Objeto / Edital <span className="text-red-500">*</span></label>
            <input className="input-field" required value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} placeholder="Ex: Pregão Eletrônico 90/2025 - Material de Limpeza" />
          </div>

          <div>
            <label className="label-title">Cliente Vinculado <span className="text-red-500">*</span></label>
            <select className="input-field" required value={formData.client_id} onChange={e => setFormData({...formData, client_id: e.target.value})}>
              <option value="">Selecione um cliente...</option>
              {clients.map(c => <option key={c.id} value={c.id}>{c.company_name}</option>)}
            </select>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div>
               <label className="label-title flex items-center gap-1"><DollarSign size={14}/> Valor Estimado (R$)</label>
               <input type="number" step="0.01" className="input-field" value={formData.value} onChange={e => setFormData({...formData, value: e.target.value})} placeholder="0.00" />
             </div>
             <div>
               <label className="label-title flex items-center gap-1"><Calendar size={14}/> Data da Disputa</label>
               <input type="date" className="input-field" required value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} />
             </div>
          </div>

          <div className="grid grid-cols-2 gap-5">
             <div>
               <label className="label-title flex items-center gap-1"><ExternalLink size={14}/> Portal</label>
               <input className="input-field" value={formData.portal || ''} onChange={e => setFormData({...formData, portal: e.target.value})} placeholder="Ex: Comprasnet" />
             </div>
             <div>
               <label className="label-title">Status Inicial</label>
               <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                 <option>Triagem</option>
                 <option>Em Análise</option>
                 <option>Disputa</option>
                 <option>Aguardando</option>
                 <option>Ganha</option>
                 <option>Perdida</option>
               </select>
             </div>
          </div>

          <div className="flex justify-end pt-4 mt-4 border-t border-slate-100 dark:border-slate-800">
            <button type="submit" disabled={isSaving} className="bg-brand-green hover:bg-brand-light text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 shadow-lg shadow-brand-green/20 transition">
              {isSaving && <Loader2 className="animate-spin" size={18}/>} Salvar Oportunidade
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}