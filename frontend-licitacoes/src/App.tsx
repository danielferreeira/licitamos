import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  Paperclip, Download, Search, MapPin, Building2, Calendar, ExternalLink,
  Briefcase, Star, XCircle, X, FileText, MessageCircle, Clock, AlertTriangle,
  Plus, Trash2, User, ChevronDown
} from 'lucide-react'

// --- DEFINIÇÕES DE TIPOS (Para o TypeScript não reclamar) ---
interface Arquivo {
  titulo: string;
  url: string;
}

interface Licitacao {
  id: number;
  titulo: string;
  descricao: string;
  orgao: string;
  valor: number;
  uf: string;
  municipio: string;
  data_publicacao: string;
  data_abertura: string | null;
  modalidade_id: number;
  link_edital: string | null;
  favorito: boolean;
  status: string;
  cliente_id: number | null;
  arquivos: Arquivo[];
}

interface Cliente {
  id: number;
  nome: string;
}

// --- COMPONENTES VISUAIS ---

const PrazoBadge = ({ dataAbertura }: { dataAbertura: string | null }) => {
  if (!dataAbertura) return null
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const dataLimite = new Date(dataAbertura)
  const diffTime = dataLimite.getTime() - hoje.getTime()
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let cor = "bg-slate-100 text-slate-500 border-slate-200"
  let texto = "Expirado"
  let icone = <Clock size={12} />

  if (diffDays < 0) { cor = "bg-slate-100 text-slate-400 border-slate-200 line-through"; texto = "Encerrado" }
  else if (diffDays <= 2) { cor = "bg-red-100 text-red-700 border-red-200 font-bold animate-pulse"; texto = diffDays === 0 ? "HOJE" : (diffDays === 1 ? "Amanhã" : `${diffDays} dias`); icone = <AlertTriangle size={12} /> }
  else if (diffDays <= 7) { cor = "bg-amber-100 text-amber-700 border-amber-200 font-bold"; texto = `${diffDays} dias` }
  else { cor = "bg-emerald-50 text-emerald-600 border-emerald-200"; texto = `${diffDays} dias` }

  return <span className={`px-2 py-0.5 rounded text-xs border flex items-center gap-1 ${cor}`}>{icone} {texto}</span>
}

const Highlighter = ({ text, highlight }: { text: string | null, highlight: string }) => {
  if (!text) return null
  if (!highlight || highlight.length < 2) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
  return <span>{parts.map((part, i) => part.toLowerCase() === highlight.toLowerCase() ? <span key={i} className="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded shadow-sm">{part}</span> : <span key={i}>{part}</span>)}</span>
}

const Badge = ({ type }: { type: number }) => {
  const colors: Record<number, string> = { 6: 'bg-blue-50 text-blue-700 border-blue-200', 8: 'bg-purple-50 text-purple-700 border-purple-200', 13: 'bg-indigo-50 text-indigo-700 border-indigo-200' }
  const defaultColor = 'bg-slate-50 text-slate-600 border-slate-200'
  const labels: Record<number, string> = { 6: 'Pregão', 8: 'Dispensa', 13: 'Concorrência' }
  return <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[type] || defaultColor}`}>{labels[type] || 'Outros'}</span>
}

// --- WIDGET AGENDA ---
const AgendaWidget = ({ licitacoes, clienteAtual }: { licitacoes: Licitacao[], clienteAtual: Cliente | null }) => {
  const hoje = new Date(); hoje.setHours(0, 0, 0, 0);
  const proximas = licitacoes
    .filter(l => {
      if (!l.data_abertura) return false
      const dataItem = new Date(l.data_abertura)
      // Só mostra se for futuro, favorito E do cliente atual (se houver cliente selecionado)
      const isFuturo = dataItem >= hoje
      const isFavorito = l.favorito
      const isDoCliente = clienteAtual ? l.cliente_id === clienteAtual.id : true
      return isFuturo && isFavorito && isDoCliente
    })
    .sort((a, b) => new Date(a.data_abertura!).getTime() - new Date(b.data_abertura!).getTime())
    .slice(0, 10)

  return (
    <div className="bg-white border-l border-slate-200 w-80 p-6 hidden lg:block overflow-y-auto shrink-0 transition-all">
      <h3 className="font-bold text-slate-700 mb-2 flex items-center gap-2"><Calendar size={20} className="text-blue-600" /> Agenda do Cliente</h3>
      <p className="text-xs text-slate-400 mb-6 border-b border-slate-100 pb-2">Visualizando: {clienteAtual?.nome || 'Geral'}</p>

      {proximas.length === 0 ? (
        <div className="text-center p-6 bg-slate-50 rounded-xl border border-dashed border-slate-300">
          <Clock size={32} className="mx-auto text-slate-300 mb-2" /><p className="text-sm text-slate-500">Sem prazos para este cliente.</p>
        </div>
      ) : (
        <div className="space-y-4 relative">
          <div className="absolute left-3.5 top-2 bottom-2 w-0.5 bg-slate-100"></div>
          {proximas.map(item => (
            <div key={item.id} className="relative pl-8 group cursor-pointer">
              <div className="absolute left-1.5 top-1.5 w-4 h-4 rounded-full border-2 border-white bg-amber-500 shadow-sm z-10 group-hover:bg-amber-600 transition-colors"></div>
              <div className="p-3 bg-white rounded-lg border border-slate-100 shadow-sm hover:shadow-md hover:border-amber-200 transition-all">
                <div className="flex justify-between items-center mb-1">
                  <span className="text-xs font-bold text-blue-600 uppercase">{item.data_abertura ? new Date(item.data_abertura).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short' }) : ''}</span>
                  <Badge type={item.modalidade_id} />
                </div>
                <p className="text-sm font-semibold text-slate-700 line-clamp-2 leading-snug mb-1" title={item.titulo}>{item.titulo}</p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// --- MODAL DETALHES ---
const ModalDetalhes = ({ licitacao, termoBusca, onClose, onUpdateStatus, clienteAtual }: { licitacao: Licitacao, termoBusca: string, onClose: () => void, onUpdateStatus: (id: number, status: string, favorito?: boolean) => void, clienteAtual: Cliente | null }) => {
  const [tab, setTab] = useState('detalhes')

  const enviarWhatsapp = () => {
    const v = licitacao.valor > 0 ? licitacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sigiloso'
    const msg = `🏛️ *Oportunidade para ${clienteAtual?.nome || 'Análise'}*\n${licitacao.titulo}\n💰 ${v}\n🔗 ${licitacao.link_edital || ''}`
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank')
  }

  // --- TAB PROPOSTA (Interno) ---
  const TabProposta = () => {
    const [itens, setItens] = useState([{ id: 1, desc: '', qtd: 1, valor: 0 }])
    const addItem = () => setItens([...itens, { id: Date.now(), desc: '', qtd: 1, valor: 0 }])
    const removeItem = (id: number) => setItens(itens.filter(i => i.id !== id))
    const total = itens.reduce((acc, i) => acc + (i.qtd * i.valor), 0)

    return (
      <div className="space-y-4">
        <div className="bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center">
          <div><p className="text-xs text-blue-600 font-bold uppercase">Valor Proposta</p><p className="text-2xl font-bold text-slate-800">{total.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</p></div>
          <button onClick={addItem} className="flex items-center gap-1 bg-blue-600 text-white px-3 py-2 rounded-md text-sm font-bold hover:bg-blue-700"><Plus size={16} /> Add Item</button>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-sm text-left">
            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200"><tr><th className="p-3">Item</th><th className="p-3 w-20">Qtd</th><th className="p-3 w-32">Unit.</th><th className="p-3 w-32">Subtotal</th><th className="p-3 w-10"></th></tr></thead>
            <tbody className="divide-y divide-slate-100">{itens.map(item => (<tr key={item.id} className="group hover:bg-slate-50"><td className="p-2"><input type="text" placeholder="Descrição" className="w-full bg-transparent outline-none" value={item.desc} onChange={e => { const n = [...itens]; n.find(i => i.id === item.id)!.desc = e.target.value; setItens(n) }} /></td><td className="p-2"><input type="number" className="w-full bg-transparent outline-none" value={item.qtd} onChange={e => { const n = [...itens]; n.find(i => i.id === item.id)!.qtd = Number(e.target.value); setItens(n) }} /></td><td className="p-2"><input type="number" className="w-full bg-transparent outline-none" value={item.valor} onChange={e => { const n = [...itens]; n.find(i => i.id === item.id)!.valor = Number(e.target.value); setItens(n) }} /></td><td className="p-2 font-medium text-slate-700">{(item.qtd * item.valor).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}</td><td className="p-2 text-center"><button onClick={() => removeItem(item.id)} className="text-slate-300 hover:text-red-500"><Trash2 size={16} /></button></td></tr>))}</tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="pr-8 flex-1">
            <div className="flex gap-2 mb-3">
              <PrazoBadge dataAbertura={licitacao.data_abertura} /><Badge type={licitacao.modalidade_id} />
              {licitacao.favorito && licitacao.cliente_id && (
                <span className="px-2 py-0.5 rounded text-xs border border-amber-200 bg-amber-50 text-amber-700 font-bold flex items-center gap-1">
                  <User size={10} /> {clienteAtual?.id === licitacao.cliente_id ? 'Meu Processo' : 'Outro Cliente'}
                </span>
              )}
            </div>
            <h2 className="text-xl font-bold text-slate-800 leading-snug line-clamp-2">
              {licitacao.titulo === "Ver Edital" ? <span className="text-slate-400 italic">Objeto não detalhado (Ver Link Externo)</span> : <Highlighter text={licitacao.titulo} highlight={termoBusca} />}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>

        <div className="flex border-b border-slate-200 px-6">
          <button onClick={() => setTab('detalhes')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'detalhes' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Visão Geral</button>
          <button onClick={() => setTab('arquivos')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'arquivos' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Arquivos ({licitacao.arquivos?.length || 0})</button>
          <button onClick={() => setTab('proposta')} className={`px-4 py-3 text-sm font-medium border-b-2 transition-colors ${tab === 'proposta' ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-500 hover:text-slate-700'}`}>Elaborar Proposta</button>
        </div>

        <div className="p-6 overflow-y-auto min-h-[200px]">
          {tab === 'detalhes' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Valor Estimado</p><p className="text-2xl font-bold text-slate-800">{licitacao.valor > 0 ? licitacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sigiloso'}</p></div>
                <div className="p-4 bg-slate-50 rounded-xl border border-slate-100"><p className="text-xs font-bold text-slate-400 uppercase mb-1">Órgão / Local</p><p className="text-sm font-bold text-slate-700">{licitacao.orgao}</p><p className="text-xs text-slate-500 mt-1">{licitacao.municipio}-{licitacao.uf}</p></div>
              </div>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 whitespace-pre-wrap"><Highlighter text={licitacao.descricao} highlight={termoBusca} /></div>
            </div>
          )}
          {tab === 'arquivos' && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {licitacao.arquivos?.map((arq, idx) => (<a key={idx} href={arq.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:border-blue-300 transition-colors text-sm"><span className="truncate text-slate-600 font-medium">{arq.titulo}</span><Download size={14} className="text-slate-400" /></a>))}
              {(!licitacao.arquivos || licitacao.arquivos.length === 0) && <p className="text-center text-slate-400 italic py-10">Arquivos não hospedados no PNCP.</p>}
            </div>
          )}
          {tab === 'proposta' && <TabProposta />}
        </div>

        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex gap-2">
            <button
              onClick={() => onUpdateStatus(licitacao.id, 'analise', !licitacao.favorito)}
              className={`px-4 py-2 rounded-lg border text-sm font-bold flex items-center gap-2 transition-all ${licitacao.favorito ? 'bg-amber-100 text-amber-700 border-amber-200' : 'bg-white text-slate-500 hover:border-amber-400 hover:text-amber-600'}`}
            >
              <Star size={16} fill={licitacao.favorito ? "currentColor" : "none"} />
              {licitacao.favorito ? 'Favorito' : 'Favoritar'}
            </button>
            <button onClick={() => { onUpdateStatus(licitacao.id, 'descartado'); onClose(); }} className="px-4 py-2 rounded-lg border border-slate-200 bg-white text-slate-500 hover:text-red-600 hover:bg-red-50 text-sm font-bold flex items-center gap-2"><XCircle size={16} /> Descartar</button>
          </div>
          <div className="flex gap-2">
            <button onClick={enviarWhatsapp} className="px-4 py-2 rounded-lg bg-green-50 text-green-700 border border-green-200 font-bold text-sm hover:bg-green-100 flex items-center gap-2"><MessageCircle size={16} /> Zap</button>
            {licitacao.link_edital && <a href={licitacao.link_edital} target="_blank" rel="noopener noreferrer" className="px-6 py-2 rounded-lg bg-blue-600 text-white font-bold text-sm hover:bg-blue-700">Ver no Portal</a>}
          </div>
        </div>
      </div>
    </div>
  )
}

// --- APP PRINCIPAL ---
function App() {
  const [licitacoes, setLicitacoes] = useState<Licitacao[]>([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState<Licitacao | null>(null)

  const [clientes, setClientes] = useState<Cliente[]>([])
  const [clienteAtual, setClienteAtual] = useState<Cliente | null>(null)

  const [busca, setBusca] = useState('')
  const [filtroUf, setFiltroUf] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('novo')
  const [filtroValorMin, setFiltroValorMin] = useState('')

  useEffect(() => {
    async function fetchClientes() {
      const { data } = await supabase.from('clientes').select('*').order('id')
      if (data && data.length > 0) {
        setClientes(data)
        setClienteAtual(data[0])
      } else {
        setClientes([{ id: 0, nome: 'Minha Consultoria' }])
      }
    }
    fetchClientes()
  }, [])

  const adicionarCliente = async () => {
    const nome = window.prompt("Nome do novo cliente (Empresa):")
    if (nome) {
      const { data } = await supabase.from('clientes').insert([{ nome }]).select()
      if (data) {
        setClientes([...clientes, data[0]])
        setClienteAtual(data[0])
      }
    }
  }

  async function carregarDados() {
    setLoading(true)
    let query = supabase.from('licitacoes').select('*').order('data_publicacao', { ascending: false }).limit(100)

    if (busca) query = query.or(`titulo.ilike.%${busca}%,descricao.ilike.%${busca}%`)
    if (filtroUf) query = query.eq('uf', filtroUf)
    if (filtroValorMin) query = query.gte('valor', filtroValorMin)

    if (filtroStatus === 'favoritos') {
      query = query.eq('favorito', true)
      if (clienteAtual?.id) query = query.eq('cliente_id', clienteAtual.id)
    }
    else if (filtroStatus === 'descartados') query = query.eq('status', 'descartado')
    else query = query.neq('status', 'descartado')

    const { data } = await query
    setLicitacoes(data || [])
    setLoading(false)
  }

  useEffect(() => {
    const t = setTimeout(carregarDados, 300);
    return () => clearTimeout(t)
  }, [busca, filtroUf, filtroStatus, filtroValorMin, clienteAtual])

  const atualizarStatus = async (id: number, novoStatus: string, favorito: boolean | null = null) => {
    setLicitacoes(prev => {
      const newList = prev.map(item => item.id === id ? {
        ...item,
        status: novoStatus,
        favorito: favorito !== null ? favorito : item.favorito,
        cliente_id: favorito ? (clienteAtual?.id || null) : null
      } : item)
      if (novoStatus === 'descartado' && filtroStatus !== 'descartados') return newList.filter(item => item.id !== id)
      if (filtroStatus === 'favoritos' && !favorito) return newList.filter(item => item.id !== id)
      return newList
    })

    if (modalOpen && modalOpen.id === id) {
      setModalOpen(prev => prev ? ({ ...prev, status: novoStatus, favorito: favorito !== null ? favorito : prev.favorito }) : null)
    }

    const updates: any = { status: novoStatus }
    if (favorito !== null) {
      updates.favorito = favorito
      updates.cliente_id = favorito ? clienteAtual?.id : null
    }
    await supabase.from('licitacoes').update(updates).eq('id', id)
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm hidden md:flex">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Briefcase className="text-white w-5 h-5" /></div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">Licitamos <span className="text-blue-600">Pro</span></h1>
        </div>

        <div className="px-4 pt-4 pb-0">
          <p className="px-2 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Carteira de Clientes</p>
          <div className="flex gap-2">
            <div className="relative flex-1">
              <select
                className="w-full p-2 bg-slate-50 border border-slate-200 rounded-md text-sm font-bold text-slate-700 outline-none appearance-none cursor-pointer hover:border-blue-300 focus:ring-2 focus:ring-blue-100 transition-all"
                value={clienteAtual?.id || ''}
                onChange={(e) => setClienteAtual(clientes.find(c => c.id === Number(e.target.value)) || null)}
              >
                {clientes.map(c => <option key={c.id} value={c.id}>{c.nome}</option>)}
              </select>
              <ChevronDown size={14} className="absolute right-2 top-3 text-slate-400 pointer-events-none" />
            </div>
            <button onClick={adicionarCliente} className="p-2 bg-blue-50 text-blue-600 rounded-md hover:bg-blue-100" title="Novo Cliente"><Plus size={18} /></button>
          </div>
        </div>

        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2 mt-2">Fluxo de Trabalho</p>
            <button onClick={() => setFiltroStatus('novo')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${filtroStatus === 'novo' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Briefcase size={18} /> Oportunidades</button>
            <button onClick={() => setFiltroStatus('favoritos')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${filtroStatus === 'favoritos' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}>
              <Star size={18} /> Favoritos
              {filtroStatus === 'favoritos' && <span className="ml-auto text-[10px] bg-amber-100 text-amber-800 px-1.5 rounded">{clienteAtual?.nome.split(' ')[0]}</span>}
            </button>
            <button onClick={() => setFiltroStatus('descartados')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${filtroStatus === 'descartados' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><XCircle size={18} /> Descartados</button>
          </div>
          <div>
            <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Filtros</p>
            <select className="w-full p-2 mx-3 bg-white border border-slate-200 rounded-md text-sm outline-none mb-3" value={filtroUf} onChange={(e) => setFiltroUf(e.target.value)}>
              <option value="">Todos os Estados</option>
              <option value="SP">São Paulo</option>
              <option value="SC">Santa Catarina</option>
              <option value="RS">Rio Grande do Sul</option>
              <option value="MG">Minas Gerais</option>
            </select>
            <div className="px-3">
              <p className="text-[10px] font-bold text-slate-400 uppercase mb-1">Valor Mínimo</p>
              <input type="number" placeholder="Ex: 50000" className="w-full p-2 bg-white border border-slate-200 rounded-md text-sm outline-none focus:border-blue-500 transition-colors" value={filtroValorMin} onChange={(e) => setFiltroValorMin(e.target.value)} />
            </div>
          </div>
        </nav>
      </aside>

      <main className="flex-1 flex flex-col h-full relative">
        <header className="bg-white border-b border-slate-200 p-6 flex justify-between items-center shadow-sm z-10">
          <div>
            <h2 className="text-2xl font-bold text-slate-800">{filtroStatus === 'novo' ? 'Novas Oportunidades' : filtroStatus === 'favoritos' ? `Favoritos: ${clienteAtual?.nome}` : 'Lixeira'}</h2>
            <p className="text-slate-500 text-sm mt-1">{loading ? 'Atualizando...' : `Mostrando ${licitacoes.length} itens`}</p>
          </div>
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Buscar..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl outline-none" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-4 pb-10">
            {licitacoes.map((item) => (
              <div key={item.id} onClick={() => setModalOpen(item)} className="bg-white rounded-xl border border-slate-200 shadow-sm p-5 cursor-pointer hover:border-blue-300 transition-all relative">

                {item.favorito && item.cliente_id === clienteAtual?.id && (
                  <div className="absolute top-0 right-0 bg-amber-100 text-amber-700 text-[10px] font-bold px-2 py-1 rounded-bl-lg border-b border-l border-amber-200">
                    {clienteAtual?.nome}
                  </div>
                )}

                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex gap-2 mb-2"><PrazoBadge dataAbertura={item.data_abertura} /><Badge type={item.modalidade_id} /></div>
                    <h3 className="text-lg font-bold text-slate-800 mb-1"><Highlighter text={item.titulo} highlight={busca} /></h3>
                    <p className="text-sm text-slate-500">{item.orgao}</p>
                  </div>
                  <div className="text-right mt-6">
                    <p className="text-xs font-bold text-slate-400 uppercase">Valor</p>
                    <p className="text-xl font-bold text-slate-800">{item.valor > 0 ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sigiloso'}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>

      <AgendaWidget licitacoes={licitacoes} clienteAtual={clienteAtual} />

      {modalOpen && <ModalDetalhes licitacao={modalOpen} termoBusca={busca} onClose={() => setModalOpen(null)} onUpdateStatus={atualizarStatus} clienteAtual={clienteAtual} />}
    </div>
  )
}
export default App