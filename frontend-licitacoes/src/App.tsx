import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  Paperclip, Download, Search, MapPin, Building2, Calendar, ExternalLink,
  Briefcase, Star, XCircle, X, FileText, MessageCircle, Clock, AlertTriangle,
  Plus, Trash2, User, ChevronDown, LayoutDashboard, List, Users, Tag, Filter,
  BarChart3, ArrowRight, MoreVertical, CheckSquare, TrendingUp
} from 'lucide-react'

// --- TIPOS ---
interface Cliente { id: number; nome: string; tags?: string[] }
interface Licitacao {
  id: number; titulo: string; descricao: string; orgao: string; valor: number;
  uf: string; municipio: string; data_publicacao: string; data_abertura: string | null; created_at: string;
  modalidade_id: number; link_edital: string | null; favorito: boolean; status: string;
  cliente_id: number | null; arquivos: any[]; fonte?: string; data_inicio_proposta?: string;
  data_fim_proposta?: string;
  data_inicio_disputa?: string;
  data_impugnacao?: string;
  data_esclarecimento?: string;
}

// --- UTILITÁRIOS VISUAIS ---
const Highlighter = ({ text, highlight }: { text: string | null | undefined, highlight: string }) => {
  if (!text) return null
  if (!highlight || highlight.length < 2) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
  return <span>{parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded shadow-sm">{part}</span> : <span key={i}>{part}</span>)}</span>
}

const Badge = ({ type, text, color }: { type?: number, text?: string, color?: string }) => {
  if (text) return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${color || 'bg-slate-100 text-slate-600 border-slate-200'}`}>{text}</span>
  const colors: Record<number, string> = { 6: 'bg-blue-50 text-blue-700 border-blue-200', 8: 'bg-purple-50 text-purple-700 border-purple-200', 13: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  const labels: Record<number, string> = { 6: 'Pregão', 8: 'Dispensa', 13: 'Concorrência' }
  return <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${colors[type || 0] || 'bg-slate-50 text-slate-600 border-slate-200'}`}>{labels[type || 0] || 'Outros'}</span>
}

const PrazoBadge = ({ dataAbertura }: { dataAbertura: string | null }) => {
  if (!dataAbertura) return <span className="text-xs text-slate-400 font-medium flex items-center gap-1"><Clock size={12} /> Data n/d</span>
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dataLimite = new Date(dataAbertura); dataLimite.setHours(0, 0, 0, 0);
  const diffTime = dataLimite.getTime() - hoje.getTime()
  const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24))
  const dataFmt = new Date(dataAbertura).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit' })

  let style = "bg-slate-100 text-slate-500 border-slate-200"; let text = `Encerrado`; let icon = <Clock size={12} />
  if (diffDays >= 0 && diffDays <= 2) { style = "bg-red-50 text-red-700 border-red-200 font-bold animate-pulse"; text = `${dataFmt} • ${diffDays === 0 ? 'HOJE' : 'Urgente'}`; icon = <AlertTriangle size={12} /> }
  else if (diffDays > 2 && diffDays <= 7) { style = "bg-amber-50 text-amber-700 border-amber-200 font-bold"; text = `${dataFmt} • ${diffDays}d` }
  else if (diffDays > 7) { style = "bg-emerald-50 text-emerald-700 border-emerald-200 font-medium"; text = `${dataFmt}` }
  return <span className={`px-2 py-0.5 rounded text-[10px] border flex items-center gap-1 uppercase tracking-wide ${style}`}>{icon} {text}</span>
}
const DateBox = ({ label, date }: { label: string, date?: string | null }) => {
  const formatted = date
    ? new Date(date).toLocaleString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
    : '---';

  return (
    <div className="bg-white border border-slate-200 rounded p-2 flex flex-col">
      <span className="text-[10px] font-bold text-slate-400 uppercase mb-1">{label}</span>
      <span className="text-sm font-semibold text-slate-700">{formatted}</span>
    </div>
  )
}

// --- COMPONENTES DO DASHBOARD ---
const ChartEstados = ({ data }: { data: Licitacao[] }) => {
  const counts: Record<string, number> = {}
  data.forEach(l => { const uf = l.uf || 'BR'; counts[uf] = (counts[uf] || 0) + 1 })
  const sorted = Object.entries(counts).sort((a, b) => b[1] - a[1]).slice(0, 5)
  const max = Math.max(...Object.values(counts), 1)
  return (
    <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm h-full">
      <h3 className="font-bold text-slate-700 mb-4 flex items-center gap-2"><BarChart3 size={20} className="text-blue-600" /> Top Regiões</h3>
      <div className="space-y-3">{sorted.map(([uf, count]) => (<div key={uf} className="flex items-center gap-3"><span className="w-6 font-bold text-slate-600 text-sm">{uf}</span><div className="flex-1 h-3 bg-slate-100 rounded-full overflow-hidden"><div className="h-full bg-blue-500 rounded-full" style={{ width: `${(count / max) * 100}%` }}></div></div><span className="text-xs text-slate-400 font-medium">{count}</span></div>))}</div>
    </div>
  )
}

const WidgetUrgencia = ({ data }: { data: Licitacao[] }) => {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const urgentes = data.filter(l => {
    if (!l.data_abertura) return false
    const dt = new Date(l.data_abertura); dt.setHours(0, 0, 0, 0);
    const diff = (dt.getTime() - hoje.getTime()) / (1000 * 3600 * 24)
    return diff >= 0 && diff <= 2
  }).slice(0, 4)
  return (
    <div className="bg-gradient-to-br from-red-50 to-white p-6 rounded-2xl border border-red-100 shadow-sm h-full">
      <h3 className="font-bold text-red-800 mb-4 flex items-center gap-2"><AlertTriangle size={20} /> Prazos Fatais</h3>
      <div className="space-y-3">
        {urgentes.map(l => (
          <div key={l.id} className="bg-white p-3 rounded-lg border border-red-100 shadow-sm flex justify-between items-center">
            <div className="truncate pr-2">
              <p className="text-xs text-red-600 font-bold mb-0.5">{new Date(l.data_abertura!).toLocaleDateString('pt-BR')} (Vence em breve)</p>
              <p className="text-sm font-medium text-slate-700 truncate" title={l.titulo}>{l.titulo}</p>
            </div>
            <ExternalLink size={14} className="text-red-400" />
          </div>
        ))}
        {urgentes.length === 0 && <div className="text-center py-10 text-slate-300">Sem urgências para hoje.</div>}
      </div>
    </div>
  )
}

// --- CARD RICO (GRID) ---
const CardLicitacao = ({ item, busca, onClick, onStatusChange, clienteNome }: { item: Licitacao, busca: string, onClick: () => void, onStatusChange: any, clienteNome?: string }) => {
  const dataSalvo = new Date(item.created_at || item.data_publicacao).toLocaleDateString('pt-BR')
  const horaAbertura = item.data_abertura ? new Date(item.data_abertura).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' }) : ''
  const isDisputa = item.status === 'disputa'

  return (
    <div className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md transition-all group overflow-hidden relative">
      <div className={`absolute left-0 top-0 bottom-0 w-1 ${isDisputa ? 'bg-emerald-500' : item.favorito ? 'bg-amber-500' : 'bg-transparent'}`}></div>
      <div className="p-5 pl-7">
        <div className="flex justify-between items-start mb-3">
          <div className="flex flex-wrap gap-2 items-center">
            <Badge text={item.fonte || 'PNCP'} color="bg-slate-800 text-white border-slate-800" />
            <Badge type={item.modalidade_id} />
            <PrazoBadge dataAbertura={item.data_abertura} />
            {item.favorito && clienteNome && (<span className="flex items-center gap-1 text-[10px] font-bold bg-amber-100 text-amber-800 px-2 py-0.5 rounded border border-amber-200 uppercase tracking-wide"><User size={10} /> {clienteNome}</span>)}
          </div>
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, 'descartado') }} className="text-slate-300 hover:text-red-500"><XCircle size={20} /></button>
        </div>

        <div className="cursor-pointer" onClick={onClick}>
          <h3 className="text-lg font-bold text-slate-800 leading-snug mb-1 hover:text-blue-700 transition-colors"><Highlighter text={item.titulo} highlight={busca} /></h3>
          <div className="text-xs text-slate-500 mb-4 font-medium flex items-center gap-1 uppercase tracking-wide"><Building2 size={12} /> {item.orgao} <span className="text-slate-300">|</span> <MapPin size={12} /> {item.municipio}-{item.uf}</div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-slate-100 border border-slate-200 rounded-lg overflow-hidden text-sm">
            <div className="bg-white p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Salvo em</p><p className="font-semibold text-slate-700">{dataSalvo}</p></div>
            <div className="bg-white p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Abertura</p><p className="font-semibold text-slate-700">{item.data_abertura ? new Date(item.data_abertura).toLocaleDateString('pt-BR') : 'N/D'} <span className="text-xs text-slate-400 font-normal ml-1">{horaAbertura}</span></p></div>
            <div className="bg-white p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Valor</p><p className="font-bold text-emerald-600">{item.valor > 0 ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sigiloso'}</p></div>
            <div className="bg-white p-3"><p className="text-[10px] font-bold text-slate-400 uppercase">Status</p><p className={`font-bold ${isDisputa ? 'text-emerald-600' : 'text-slate-700'}`}>{item.status === 'novo' ? 'Novo' : item.status === 'analise' ? 'Em Análise' : item.status === 'disputa' ? 'Em Disputa' : 'Descartado'}</p></div>
          </div>
        </div>

        <div className="mt-4 flex gap-3">
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, 'disputa', true) }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all ${isDisputa ? 'bg-emerald-100 text-emerald-700 border border-emerald-200' : 'bg-slate-900 text-white hover:bg-slate-800'}`}>{isDisputa ? <CheckSquare size={16} /> : ''} {isDisputa ? 'Participando' : 'Participar'}</button>
          <button onClick={(e) => { e.stopPropagation(); onStatusChange(item.id, 'analise', !item.favorito) }} className={`flex-1 py-2 px-4 rounded-lg text-sm font-bold flex justify-center items-center gap-2 transition-all border ${item.favorito ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-amber-50'}`}><Star size={16} fill={item.favorito ? "currentColor" : "none"} /> {item.favorito ? 'Favorito' : 'Favoritar'}</button>
          <button onClick={onClick} className="flex-1 py-2 px-4 bg-white border border-slate-200 text-slate-700 font-bold rounded-lg text-sm hover:bg-slate-50 hover:text-blue-600 hover:border-blue-200 transition-all flex justify-center items-center gap-2"><FileText size={16} /> Detalhes</button>
        </div>
      </div>
    </div>
  )
}

// --- MODAL DETALHES ---
const ModalDetalhes = ({ licitacao, termoBusca, onClose, onUpdateStatus, clienteAtual }: any) => {
  const [tab, setTab] = useState('detalhes')
  const enviarWhatsapp = () => {
    const v = licitacao.valor > 0 ? licitacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sigiloso'
    const msg = `🏛️ *Licitação:*\n${licitacao.titulo}\n💰 ${v}\n🔗 ${licitacao.link_edital || ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // Tab Proposta Interna
  const TabProposta = () => {
    const [itens, setItens] = useState([{ id: 1, desc: '', qtd: 1, valor: 0 }])
    const addItem = () => setItens([...itens, { id: Date.now(), desc: '', qtd: 1, valor: 0 }])
    const removeItem = (id: number) => setItens(itens.filter(i => i.id !== id))
    const total = itens.reduce((acc, i) => acc + (i.qtd * i.valor), 0)
    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center"><div><p className="text-xs text-blue-600 font-bold uppercase">Valor Proposta</p><p className="text-2xl font-bold text-slate-800">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div><button onClick={addItem} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-bold hover:bg-blue-700"><Plus size={16} /> Add Item</button></div>
        <div className="border border-slate-200 rounded-lg overflow-hidden"><table className="w-full text-sm text-left"><thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200"><tr><th className="p-3">Item</th><th className="p-3 w-20">Qtd</th><th className="p-3 w-32">Unit.</th><th className="p-3 w-32">Subtotal</th><th className="p-3 w-10"></th></tr></thead><tbody className="divide-y divide-slate-100">{itens.map(item => (<tr key={item.id} className="group hover:bg-slate-50"><td className="p-2"><input type="text" placeholder="Descrição" className="w-full bg-transparent outline-none" value={item.desc} onChange={e => { const n = [...itens]; n.find(i => i.id === item.id)!.desc = e.target.value; setItens(n) }} /></td><td className="p-2"><input type="number" className="w-full bg-transparent outline-none" value={item.qtd} onChange={e => { const n = [...itens]; n.find(i => i.id === item.id)!.qtd = Number(e.target.value); setItens(n) }} /></td><td className="p-2"><input type="number" className="w-full bg-transparent outline-none" value={item.valor} onChange={e => { const n = [...itens]; n.find(i => i.id === item.id)!.valor = Number(e.target.value); setItens(n) }} /></td><td className="p-2 font-medium text-slate-700">{(item.qtd * item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-2 text-center"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody></table></div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="pr-8 flex-1"><h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-2"><Highlighter text={licitacao.titulo} highlight={termoBusca} /></h2></div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>
        <div className="flex border-b border-slate-200 px-6"><button onClick={() => setTab('detalhes')} className={`px-4 py-3 text-sm font-bold border-b-2 capitalize transition-colors ${tab === 'detalhes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Visão Geral</button><button onClick={() => setTab('arquivos')} className={`px-4 py-3 text-sm font-bold border-b-2 capitalize transition-colors ${tab === 'arquivos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Arquivos</button><button onClick={() => setTab('proposta')} className={`px-4 py-3 text-sm font-bold border-b-2 capitalize transition-colors ${tab === 'proposta' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500'}`}>Proposta</button></div>
        <div className="p-8 overflow-y-auto min-h-[300px] bg-slate-50/30">
          {tab === 'detalhes' && (
            <div className="space-y-6">
              <div className="mt-6">
                <h3 className="text-sm font-bold text-slate-800 mb-3 flex items-center gap-2">
                  <Clock size={16} className="text-blue-500" /> Cronograma
                </h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 bg-slate-50 p-4 rounded-xl border border-slate-100">
                  <DateBox label="Publicação" date={licitacao.data_publicacao} />
                  <DateBox label="Início Rec. Proposta" date={licitacao.data_inicio_proposta} />
                  <DateBox label="Fim Rec. Proposta" date={licitacao.data_fim_proposta} />
                  <DateBox label="Início Disputa" date={licitacao.data_inicio_disputa} />

                  <DateBox label="Fim Impugnação" date={licitacao.data_impugnacao} />
                  <DateBox label="Fim Esclarecimentos" date={licitacao.data_esclarecimento} />
                </div>
              </div>
              <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm"><h3 className="text-sm font-bold text-slate-800 mb-4 flex items-center gap-2"><FileText size={16} className="text-blue-500" /> Objeto / Descrição</h3><div className="text-sm text-slate-600 leading-relaxed whitespace-pre-wrap"><Highlighter text={licitacao.descricao} highlight={termoBusca} /></div></div>
              <div className="grid grid-cols-2 gap-4"><div className="bg-white p-4 rounded-xl border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Órgão</p><p className="font-semibold text-slate-700">{licitacao.orgao}</p></div><div className="bg-white p-4 rounded-xl border border-slate-200"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Local</p><p className="font-semibold text-slate-700">{licitacao.municipio}-{licitacao.uf}</p></div></div>
            </div>
          )}
          {tab === 'arquivos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {licitacao.arquivos?.map((arq: any, idx: number) => (<a key={idx} href={arq.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm transition-all group"><div className="flex items-center gap-3 overflow-hidden"><div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Paperclip size={18} /></div><span className="truncate text-sm font-bold text-slate-700 group-hover:text-blue-700">{arq.titulo}</span></div><Download size={16} className="text-slate-400 group-hover:text-blue-500" /></a>))}
              {(!licitacao.arquivos || licitacao.arquivos.length === 0) && <div className="col-span-2 text-center py-12 bg-white rounded-xl border border-dashed border-slate-300"><p className="text-slate-500 font-medium">Arquivos não disponíveis diretamente.</p>{licitacao.link_edital && <a href={licitacao.link_edital} target="_blank" className="text-blue-600 text-sm font-bold mt-2 inline-block hover:underline">Acessar Portal Externo</a>}</div>}
            </div>
          )}
          {tab === 'proposta' && <TabProposta />}
        </div>
        <div className="p-6 border-t border-slate-100 bg-white flex justify-between items-center">
          <div className="flex gap-2"><button onClick={() => { onUpdateStatus(licitacao.id, 'analise', !licitacao.favorito); onClose(); }} className={`px-4 py-2.5 rounded-lg border text-sm font-bold flex items-center gap-2 transition-all ${licitacao.favorito ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'}`}><Star size={16} fill={licitacao.favorito ? "currentColor" : "none"} /> {licitacao.favorito ? 'Favoritado' : 'Favoritar'}</button><button onClick={enviarWhatsapp} className="px-4 py-2.5 rounded-lg border border-green-200 bg-green-50 text-green-700 font-bold text-sm hover:bg-green-100 flex items-center gap-2"><MessageCircle size={18} /> WhatsApp</button></div>
          {licitacao.link_edital && <a href={licitacao.link_edital} target="_blank" rel="noopener noreferrer" className="px-6 py-2.5 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700 shadow-lg shadow-blue-200 transition-all flex items-center gap-2">Ir para o Portal <ExternalLink size={16} /></a>}
        </div>
      </div>
    </div>
  )
}

// --- APP PRINCIPAL ---
function App() {
  const [view, setView] = useState('dashboard') // PADRÃO: DASHBOARD
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState<Licitacao | null>(null)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteAtual, setClienteAtual] = useState<Cliente | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroUf, setFiltroUf] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('novo')
  const [filtroValorMin, setFiltroValorMin] = useState('')
  const [stats, setStats] = useState({ novas: 0, favoritos: 0, disputa: 0, descartados: 0 })

  useEffect(() => { fetchDados() }, [])

  async function fetchDados() {
    const { data: clientesData } = await supabase.from('clientes').select('*, cliente_tags(tag)')
    const clientesFormatados = clientesData?.map(c => ({ ...c, tags: c.cliente_tags.map((t: any) => t.tag) })) || []
    setClientes(clientesFormatados)
    if (!clienteAtual && clientesFormatados.length > 0) setClienteAtual(clientesFormatados[0])

    const { data: licData } = await supabase.from('licitacoes').select('*').order('data_publicacao', { ascending: false }).limit(200)
    if (licData) {
      setLicitacoes(licData)
      setStats({
        novas: licData.filter(l => l.status === 'novo').length,
        favoritos: licData.filter(l => l.favorito).length,
        disputa: licData.filter(l => l.status === 'disputa').length,
        descartados: licData.filter(l => l.status === 'descartado').length
      })
    }
    setLoading(false)
  }

  // --- NAVEGAÇÃO E FILTROS ---
  const changeView = (v: string, f?: string) => { setView(v); if (f) setFiltroStatus(f) }

  const filteredLicitacoes = licitacoes.filter(item => {
    let matchTexto = true;
    const textoItem = (item.titulo + ' ' + item.descricao + ' ' + item.orgao).toLowerCase();
    if (busca !== '') { matchTexto = textoItem.includes(busca.toLowerCase()); }
    else if (filtroStatus === 'novo' && clienteAtual && clienteAtual.tags && clienteAtual.tags.length > 0) { matchTexto = clienteAtual.tags.some(tag => textoItem.includes(tag.toLowerCase())); }

    const matchStatus = filtroStatus === 'favoritos' ? item.favorito : filtroStatus === 'descartados' ? item.status === 'descartado' : filtroStatus === 'disputa' ? item.status === 'disputa' : item.status === 'novo'
    const matchCliente = (filtroStatus === 'favoritos' || filtroStatus === 'disputa') ? (clienteAtual ? item.cliente_id === clienteAtual.id : true) : true
    const matchUf = filtroUf === '' || item.uf === filtroUf
    const matchValor = filtroValorMin === '' || item.valor >= Number(filtroValorMin)
    return matchTexto && matchStatus && matchCliente && matchUf && matchValor
  })

  // --- ACTIONS ---
  const atualizarStatus = async (id: number, novoStatus: string, favorito: boolean | null = null) => {
    setLicitacoes(prev => prev.map(item => item.id === id ? {
      ...item, status: novoStatus, favorito: favorito !== null ? favorito : item.favorito,
      cliente_id: favorito ? (clienteAtual?.id || null) : null
    } : item))
    if (modalOpen && modalOpen.id === id) { setModalOpen(prev => prev ? ({ ...prev, status: novoStatus, favorito: favorito !== null ? favorito : prev.favorito }) : null) }
    const updates: any = { status: novoStatus }
    if (favorito !== null) { updates.favorito = favorito; updates.cliente_id = favorito ? clienteAtual?.id : null }
    await supabase.from('licitacoes').update(updates).eq('id', id)
    setStats(prev => ({ ...prev, [novoStatus === 'novo' ? 'novas' : novoStatus]: prev[novoStatus as keyof typeof prev] + 1 }))
  }
  const addCliente = async (nome: string) => { await supabase.from('clientes').insert([{ nome }]); fetchDados() }
  const addTag = async (clienteId: number, tag: string) => { await supabase.from('cliente_tags').insert([{ cliente_id: clienteId, tag }]); fetchDados() }
  const removeTag = async (clienteId: number, tag: string) => { await supabase.from('cliente_tags').delete().match({ cliente_id: clienteId, tag }); fetchDados() }

  // --- TELA DASHBOARD ---
  const DashboardScreen = () => (
    <div className="p-8 max-w-7xl mx-auto overflow-y-auto h-full pb-20">
      <div className="mb-8"><h1 className="text-3xl font-bold text-slate-800 mb-1">Painel de Controle</h1><p className="text-slate-500">Resumo da sua carteira.</p></div>
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div onClick={() => changeView('licitacoes', 'novo')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-blue-400 hover:shadow-md transition-all group relative overflow-hidden"><div className="relative z-10"><div className="flex items-center gap-3 mb-2 text-blue-600"><Search size={24} /> <span className="font-bold">Novas</span></div><h3 className="text-4xl font-bold text-slate-800">{stats.novas}</h3></div></div>
        <div onClick={() => changeView('licitacoes', 'favoritos')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-amber-400 hover:shadow-md transition-all group relative overflow-hidden"><div className="relative z-10"><div className="flex items-center gap-3 mb-2 text-amber-600"><Star size={24} /> <span className="font-bold">Em Análise</span></div><h3 className="text-4xl font-bold text-slate-800">{stats.favoritos}</h3></div></div>
        <div onClick={() => changeView('licitacoes', 'disputa')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-emerald-400 hover:shadow-md transition-all group relative overflow-hidden"><div className="relative z-10"><div className="flex items-center gap-3 mb-2 text-emerald-600"><Briefcase size={24} /> <span className="font-bold">Em Disputa</span></div><h3 className="text-4xl font-bold text-slate-800">{stats.disputa || 0}</h3></div></div>
        <div onClick={() => changeView('licitacoes', 'descartados')} className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm cursor-pointer hover:border-slate-400 hover:shadow-md transition-all group"><div className="flex items-center gap-3 mb-2 text-slate-400"><Trash2 size={24} /> <span className="font-bold">Descartadas</span></div><h3 className="text-4xl font-bold text-slate-700">{stats.descartados}</h3></div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="md:col-span-1"><ChartEstados data={licitacoes} /></div>
        <div className="md:col-span-1"><WidgetUrgencia data={licitacoes} /></div>
        <div className="md:col-span-1 bg-slate-900 rounded-2xl p-6 text-white flex flex-col justify-between shadow-lg relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-blue-600 rounded-full blur-3xl opacity-20 -mr-10 -mt-10"></div>
          <div><h3 className="text-lg font-bold mb-2 flex items-center gap-2"><TrendingUp size={18} /> Aumente suas vendas</h3><p className="text-slate-300 text-sm">Use o filtro de Valor Mínimo para focar em grandes contratos.</p></div>
          <button onClick={() => changeView('licitacoes')} className="mt-6 w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-sm transition-colors flex items-center justify-center gap-2">Ir para Lista <ArrowRight size={16} /></button>
        </div>
      </div>
    </div>
  )

  // --- TELA CLIENTES ---
  const GestaoClientes = ({ clientes, onAddCliente, onAddTag, onRemoveTag }: any) => {
    const [novoCliente, setNovoCliente] = useState(''); const [novaTag, setNovaTag] = useState(''); const [selCli, setSelCli] = useState<number | null>(null)
    return (
      <div className="p-8 max-w-5xl mx-auto h-full overflow-y-auto">
        <h1 className="text-2xl font-bold text-slate-800 mb-6 flex items-center gap-2"><Users className="text-blue-600" /> Gestão de Carteira</h1>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl border border-slate-200 shadow-sm overflow-hidden"><div className="p-4 border-b border-slate-100 bg-slate-50 font-bold text-slate-700">Meus Clientes</div><div className="p-4 border-b border-slate-100 flex gap-2"><input value={novoCliente} onChange={e => setNovoCliente(e.target.value)} placeholder="Nome da Empresa" className="flex-1 p-2 text-sm border rounded outline-none" /><button onClick={() => { if (novoCliente) { onAddCliente(novoCliente); setNovoCliente('') } }} className="p-2 bg-blue-600 text-white rounded hover:bg-blue-700"><Plus size={18} /></button></div><div className="divide-y divide-slate-100">{clientes.map((c: any) => (<div key={c.id} onClick={() => setSelCli(c.id)} className={`p-4 cursor-pointer hover:bg-blue-50 transition-colors ${selCli === c.id ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}><p className="font-bold text-slate-800">{c.nome}</p><p className="text-xs text-slate-500 mt-1">{c.tags?.length || 0} tags de monitoramento</p></div>))}</div></div>
          <div className="md:col-span-2 bg-white rounded-xl border border-slate-200 shadow-sm p-6">{selCli ? (<><h3 className="font-bold text-lg text-slate-800 mb-2">Palavras-Chave</h3><div className="flex gap-2 mb-6"><input value={novaTag} onChange={e => setNovaTag(e.target.value)} placeholder="Ex: Pavimentação..." className="flex-1 p-3 border border-slate-200 rounded-lg outline-none focus:border-blue-500" /><button onClick={() => { if (novaTag) { onAddTag(selCli, novaTag); setNovaTag('') } }} className="px-6 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700">Adicionar</button></div><div className="flex flex-wrap gap-2">{clientes.find((c: any) => c.id === selCli)?.tags?.map((tag: string, idx: number) => (<span key={idx} className="px-3 py-1.5 bg-slate-100 text-slate-700 rounded-full text-sm font-medium border border-slate-200 flex items-center gap-2"><Tag size={14} className="text-blue-500" /> {tag}<button onClick={() => onRemoveTag(selCli, tag)} className="hover:text-red-500"><X size={14} /></button></span>))}</div></>) : <div className="h-full flex flex-col items-center justify-center text-slate-400"><Users size={48} className="mb-4 opacity-20" /><p>Selecione um cliente ao lado.</p></div>}</div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      {/* SIDEBAR NAVIGATION */}
      <aside className="w-20 bg-slate-900 flex flex-col items-center py-6 gap-6 z-20 shadow-xl shrink-0">
        <div className="bg-blue-600 p-2 rounded-lg mb-4"><Briefcase className="text-white w-6 h-6" /></div>
        <button onClick={() => setView('dashboard')} className={`p-3 rounded-xl transition-all ${view === 'dashboard' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Dashboard"><LayoutDashboard size={24} /></button>
        <button onClick={() => setView('licitacoes')} className={`p-3 rounded-xl transition-all ${view === 'licitacoes' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Licitações"><List size={24} /></button>
        <button onClick={() => setView('clientes')} className={`p-3 rounded-xl transition-all ${view === 'clientes' ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-white hover:bg-white/5'}`} title="Clientes"><Users size={24} /></button>
      </aside>

      {/* SIDEBAR FILTROS (SÓ NA LISTA) */}
      {view === 'licitacoes' && (
        <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shrink-0">
          <div className="p-6 border-b border-slate-100"><h2 className="font-bold text-slate-800">Filtros</h2></div>
          <div className="p-4 space-y-6 overflow-y-auto flex-1">
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Cliente Ativo</p>
              <div className="relative"><select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-700 outline-none" value={clienteAtual?.id || ''} onChange={(e) => setClienteAtual(clientes.find(c => c.id === Number(e.target.value)) || null)}>{clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}</select><ChevronDown size={14} className="absolute right-2 top-3 text-slate-400 pointer-events-none" /></div>
              <div className="mt-3 flex flex-wrap gap-1">{clienteAtual?.tags?.map(tag => (<button key={tag} onClick={() => setBusca(tag)} className={`text-[10px] px-2 py-1 rounded border transition-colors ${busca === tag ? 'bg-blue-100 text-blue-700 border-blue-200' : 'bg-white text-slate-500 border-slate-200 hover:border-blue-300'}`}>{tag}</button>))}</div>
            </div>
            <div>
              <p className="text-xs font-bold text-slate-400 uppercase mb-2">Status</p>
              <div className="space-y-1">
                <button onClick={() => setFiltroStatus('novo')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${filtroStatus === 'novo' ? 'bg-blue-50 text-blue-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Novas <span className="bg-slate-100 px-1.5 rounded text-xs">{stats.novas}</span></button>
                <button onClick={() => setFiltroStatus('favoritos')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${filtroStatus === 'favoritos' ? 'bg-amber-50 text-amber-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Em Análise <span className="bg-slate-100 px-1.5 rounded text-xs">{stats.favoritos}</span></button>
                <button onClick={() => setFiltroStatus('disputa')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${filtroStatus === 'disputa' ? 'bg-emerald-50 text-emerald-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Em Disputa <span className="bg-slate-100 px-1.5 rounded text-xs">{stats.disputa}</span></button>
                <button onClick={() => setFiltroStatus('descartados')} className={`w-full flex items-center justify-between px-3 py-2 rounded-md text-sm ${filtroStatus === 'descartados' ? 'bg-red-50 text-red-700 font-bold' : 'text-slate-600 hover:bg-slate-50'}`}>Lixeira</button>
              </div>
            </div>
            <div><p className="text-xs font-bold text-slate-400 uppercase mb-2">Estado</p><select className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm" value={filtroUf} onChange={e => setFiltroUf(e.target.value)}><option value="">Todos</option><option value="SC">SC</option><option value="PR">PR</option><option value="SP">SP</option></select></div>
          </div>
        </aside>
      )}

      <main className="flex-1 flex flex-col h-full bg-slate-50/50 relative overflow-hidden">
        {view === 'dashboard' && <DashboardScreen />}
        {view === 'clientes' && <GestaoClientes clientes={clientes} onAddCliente={addCliente} onAddTag={addTag} onRemoveTag={removeTag} />}
        {view === 'licitacoes' && (
          <div className="flex flex-col h-full">
            <header className="bg-white border-b border-slate-200 p-4 flex items-center justify-between shadow-sm z-10 shrink-0">
              <div className="flex items-center gap-4 flex-1"><div className="relative flex-1 max-w-xl group"><Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" /><input type="text" placeholder={`Buscar licitações...`} className="w-full pl-10 pr-4 py-2.5 bg-slate-100 rounded-lg outline-none" value={busca} onChange={(e) => setBusca(e.target.value)} /></div></div>
            </header>
            <div className="flex-1 overflow-y-auto p-6">
              <div className="max-w-5xl mx-auto space-y-4">
                {filteredLicitacoes.map(item => <CardLicitacao key={item.id} item={item} busca={busca} onClick={() => setModalOpen(item)} onStatusChange={atualizarStatus} clienteNome={clienteAtual?.nome} />)}
                {filteredLicitacoes.length === 0 && <div className="text-center py-20 text-slate-400">Nenhum resultado encontrado.</div>}
              </div>
            </div>
          </div>
        )}
      </main>
      {modalOpen && <ModalDetalhes licitacao={modalOpen} termoBusca={busca} onClose={() => setModalOpen(null)} onUpdateStatus={atualizarStatus} clienteAtual={clienteAtual} />}
    </div>
  )
}

export default App