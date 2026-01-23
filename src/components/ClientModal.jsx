import { X, Loader2, MapPin, Globe, Mail, FileText, Search, CheckCircle, Building2, Phone } from 'lucide-react'
import { useState, useEffect } from 'react'
import { maskDocument, maskPhone, maskZipCode } from '../utils/formatters'
import { external } from '../services/external'
import { toast } from 'sonner'

export function ClientModal({ isOpen, onClose, onSave, initialData }) {
  const initialFormState = { 
    company_name: '', cnpj: '', status: 'Prospect', contact_person: '', 
    phone: '', email: '', website: '', zip_code: '', city: '', state: '', 
    street: '', number: '', neighborhood: '', notes: '' 
  }
  
  const [formData, setFormData] = useState(initialFormState)
  const [isSaving, setIsSaving] = useState(false)
  const [loadingField, setLoadingField] = useState(null)

  useEffect(() => {
    if (initialData) setFormData(initialData)
    else setFormData(initialFormState)
  }, [initialData, isOpen])

  // ... imports e código anterior

  const handleSubmit = async (e) => {
    e.preventDefault()
    setIsSaving(true)

    try {
      // SOLUÇÃO BLINDADA (Whitelist):
      // Criamos um objeto NOVO apenas com os campos permitidos no banco.
      // Isso ignora automaticamente client_documents, history, id, created_at, etc.
      
      const payload = {
        company_name: formData.company_name,
        cnpj: formData.cnpj,
        status: formData.status,
        contact_person: formData.contact_person, // Se sua tabela tiver essa coluna
        phone: formData.phone,
        email: formData.email,
        website: formData.website,
        zip_code: formData.zip_code,
        city: formData.city,
        state: formData.state,
        street: formData.street,
        number: formData.number,
        neighborhood: formData.neighborhood,
        notes: formData.notes
      }

      // Se for edição, precisamos passar o ID separadamente para a API saber quem atualizar
      // mas NÃO mandamos o ID dentro do payload de dados (body) para evitar confusão.
      const dataToSend = initialData?.id 
        ? { ...payload, id: initialData.id } // Adiciona ID só para a lógica do api.saveClient
        : payload

      console.log("Enviando dados limpos:", dataToSend) // Para debug no console

      await onSave(dataToSend)
      
      toast.success('Dados salvos!')
      onClose()
    } 
    catch (error) {
      console.error("Erro ao salvar:", error)
      toast.error('Erro ao salvar. Verifique o console.')
    } 
    finally {
      setIsSaving(false)
    }
  }


  // Busca de CEP (Mantive automática pois é muito prático, mas pode tirar se quiser)
  async function handleSearchCEP(cepValue) {
    const cepToSearch = cepValue || formData.zip_code
    if (!cepToSearch || cepToSearch.length < 9) return

    setLoadingField('cep')
    try {
      const address = await external.fetchCEP(cepToSearch)
      setFormData(prev => ({ ...prev, ...address }))
      toast.success('Endereço encontrado!')
    } catch (error) {
      console.error(error)
    } finally {
      setLoadingField(null)
    }
  }

  const handleZipChange = (e) => {
    const value = maskZipCode(e.target.value)
    setFormData(prev => ({ ...prev, zip_code: value }))
    if (value.length === 9) handleSearchCEP(value)
  }

  // Busca de CNPJ (Agora SOMENTE Manual)
  async function handleSearchCNPJ() {
    if (!formData.cnpj) return toast.warning("Digite um CNPJ para buscar.")
    
    setLoadingField('cnpj')
    try {
      const data = await external.fetchCNPJ(formData.cnpj)
      const extraNotes = `[Auto] Situação: ${data.status_receita || 'N/A'}\n[Auto] Fantasia: ${data.fantasy_name || '-'}`
      
      setFormData(prev => ({
        ...prev,
        ...data,
        notes: prev.notes ? `${prev.notes}\n${extraNotes}` : extraNotes
      }))
      toast.success('Dados da empresa importados!')
    } catch (error) {
      toast.error(error.message)
    } finally {
      setLoadingField(null)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fade-in">
      <div className="bg-white dark:bg-slate-900 rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 dark:border-slate-800 flex flex-col max-h-[90vh] transition-colors">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 dark:border-slate-800 flex justify-between items-center bg-white dark:bg-slate-900 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-brand-green/10 dark:bg-brand-green/20 rounded-xl flex items-center justify-center text-brand-green dark:text-brand-light">
               <Building2 size={20}/>
            </div>
            <div>
              <h2 className="font-bold text-lg text-slate-800 dark:text-white">
                {initialData?.id ? 'Editar Cliente' : 'Novo Cliente'}
              </h2>
              <p className="text-xs text-slate-400 dark:text-slate-500">Cadastro de Empresa / Pessoa</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition text-slate-400"><X size={20} /></button>
        </div>
        
        <form onSubmit={handleSubmit} className="p-6 overflow-y-auto custom-scrollbar">
          <div className="space-y-8">
            
            {/* DADOS DA EMPRESA */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-brand-green dark:text-brand-light uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4">Dados Principais</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                <div className="relative">
                  <label className="label-title">CNPJ <span className="text-slate-400 text-[10px] ml-1">(Opcional)</span></label>
                  <div className="relative flex items-center">
                    <input 
                      className="input-field pr-12"
                      value={formData.cnpj || ''} 
                      onChange={e => setFormData({...formData, cnpj: maskDocument(e.target.value)})} 
                      // REMOVIDO: onBlur={handleSearchCNPJ} (Agora só busca no clique)
                      placeholder="00.000.000/0000-00"
                      maxLength={18}
                      // REMOVIDO: required (Agora é opcional)
                    />
                    <button 
                      type="button"
                      onClick={handleSearchCNPJ}
                      disabled={loadingField === 'cnpj' || !formData.cnpj}
                      className="absolute right-2 p-1.5 bg-brand-green/10 text-brand-green rounded-lg hover:bg-brand-green/20 transition disabled:opacity-50"
                      title="Buscar dados na Receita"
                    >
                      {loadingField === 'cnpj' ? <Loader2 size={16} className="animate-spin"/> : <Search size={16}/>}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="label-title">Status</label>
                  <select className="input-field" value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})}>
                    <option value="Prospect">Prospect</option>
                    <option value="Em Negociação">Em Negociação</option>
                    <option value="Cliente">Cliente Ativo</option>
                    <option value="Inativo">Inativo</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="label-title">Razão Social / Nome <span className="text-red-500">*</span></label>
                <input className="input-field" required value={formData.company_name} onChange={e => setFormData({...formData, company_name: e.target.value})} placeholder="Nome da empresa ou cliente"/>
              </div>
            </div>

            {/* ENDEREÇO */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-brand-green dark:text-brand-light uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
                 <MapPin size={14}/> Endereço
               </h3>

               <div className="grid grid-cols-3 gap-5">
                  <div className="relative">
                    <label className="label-title">CEP</label>
                    <div className="relative flex items-center">
                      <input 
                        className="input-field pr-10" 
                        value={formData.zip_code || ''} 
                        onChange={handleZipChange} 
                        placeholder="00000-000" 
                        maxLength={9}
                      />
                      <div className="absolute right-3 text-slate-400">
                        {loadingField === 'cep' ? <Loader2 size={16} className="animate-spin text-brand-green"/> : <Search size={16} className="cursor-pointer hover:text-brand-green" onClick={() => handleSearchCEP(formData.zip_code)}/>}
                      </div>
                    </div>
                  </div>
                  <div className="col-span-2">
                    <label className="label-title">Rua / Logradouro</label>
                    <input className="input-field" value={formData.street || ''} onChange={e => setFormData({...formData, street: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-5">
                  <div>
                    <label className="label-title">Número</label>
                    <input className="input-field" value={formData.number || ''} onChange={e => setFormData({...formData, number: e.target.value})} />
                  </div>
                  <div className="col-span-2">
                    <label className="label-title">Bairro</label>
                    <input className="input-field" value={formData.neighborhood || ''} onChange={e => setFormData({...formData, neighborhood: e.target.value})} />
                  </div>
               </div>

               <div className="grid grid-cols-3 gap-5">
                  <div className="col-span-2">
                    <label className="label-title">Cidade</label>
                    <input className="input-field" value={formData.city || ''} onChange={e => setFormData({...formData, city: e.target.value})} />
                  </div>
                  <div>
                    <label className="label-title">UF</label>
                    <input className="input-field uppercase" value={formData.state || ''} onChange={e => setFormData({...formData, state: e.target.value.toUpperCase()})} maxLength={2} />
                  </div>
               </div>
            </div>

            {/* CONTATO */}
            <div className="space-y-4">
               <h3 className="text-xs font-bold text-brand-green dark:text-brand-light uppercase tracking-wider border-b border-slate-100 dark:border-slate-800 pb-2 mb-4 flex items-center gap-2">
                 <Globe size={14}/> Contato
               </h3>
               
               <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                 <div>
                    <label className="label-title">Telefone / WhatsApp</label>
                    <div className="relative">
                      <input className="input-field pl-10" value={formData.phone || ''} onChange={e => setFormData({...formData, phone: maskPhone(e.target.value)})} placeholder="(00) 00000-0000" maxLength={15}/>
                      <Phone className="absolute left-3 top-3 text-slate-400" size={18}/>
                      {formData.phone && (
                        <a 
                          href={`https://wa.me/55${formData.phone.replace(/\D/g, '')}`} 
                          target="_blank" 
                          rel="noreferrer"
                          className="absolute right-2 top-2 p-1 bg-green-100 text-green-600 rounded hover:bg-green-200 text-[10px] font-bold flex items-center gap-1 transition"
                        >
                           WhatsApp ↗
                        </a>
                      )}
                    </div>
                 </div>
                 <div>
                    <label className="label-title">E-mail</label>
                    <div className="relative">
                      <Mail className="absolute left-3 top-3 text-slate-400" size={18}/>
                      <input className="input-field pl-10" type="email" value={formData.email || ''} onChange={e => setFormData({...formData, email: e.target.value})} />
                    </div>
                 </div>
               </div>
               
               <div>
                  <label className="label-title">Observações</label>
                  <textarea className="input-field min-h-[80px]" value={formData.notes || ''} onChange={e => setFormData({...formData, notes: e.target.value})} placeholder="Histórico, situação cadastral, etc." />
               </div>
            </div>

          </div>

          <div className="flex gap-3 justify-end pt-6 mt-8 border-t border-slate-100 dark:border-slate-800 sticky bottom-0 bg-white dark:bg-slate-900">
            <button type="button" onClick={onClose} className="px-6 py-3 text-slate-500 font-bold hover:bg-slate-50 dark:hover:bg-slate-800 rounded-xl transition">Cancelar</button>
            <button type="submit" disabled={isSaving} className="bg-brand-green hover:bg-brand-light text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-brand-green/20 transition flex items-center gap-2">
              {isSaving ? <Loader2 className="animate-spin" size={20}/> : <CheckCircle size={20}/>} Salvar
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}