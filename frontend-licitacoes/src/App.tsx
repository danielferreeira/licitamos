import { useEffect, useState } from 'react'
import { supabase } from './supabaseClient'
import {
  Paperclip, Download, Search, MapPin, Building2, Calendar, ExternalLink,
  Briefcase, Star, XCircle, X, FileText, MessageCircle, Clock, AlertTriangle
} from 'lucide-react'

// --- 1. COMPONENTE DE PRAZO (SEMÁFORO) ---
const PrazoBadge = ({ dataAbertura }) => {
  if (!dataAbertura) return null

  const hoje = new Date()
  const dataLimite = new Date(dataAbertura)

  // Diferença em dias
  const diffTime = dataLimite - hoje
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  let cor = "bg-slate-100 text-slate-500 border-slate-200" // Padrão
  let texto = "Expirado"
  let icone = <Clock size={12} />

  if (diffDays < 0) {
    cor = "bg-slate-100 text-slate-400 border-slate-200 line-through"
    texto = "Encerrado"
  } else if (diffDays <= 2) {
    cor = "bg-red-100 text-red-700 border-red-200 font-bold animate-pulse"
    texto = diffDays === 0 ? "HOJE" : (diffDays === 1 ? "Amanhã" : `${diffDays} dias`)
    icone = <AlertTriangle size={12} />
  } else if (diffDays <= 7) {
    cor = "bg-amber-100 text-amber-700 border-amber-200 font-bold"
    texto = `${diffDays} dias`
  } else {
    cor = "bg-emerald-50 text-emerald-600 border-emerald-200"
    texto = `${diffDays} dias`
  }

  return (
    <span className={`px-2 py-0.5 rounded text-xs border flex items-center gap-1 ${cor}`} title={`Abertura: ${dataLimite.toLocaleDateString()}`}>
      {icone} {texto}
    </span>
  )
}

const Highlighter = ({ text, highlight }) => {
  if (!text) return null
  if (!highlight || highlight.length < 2) return <span>{text}</span>
  const parts = text.split(new RegExp(`(${highlight})`, 'gi'))
  return (
    <span>
      {parts.map((part, i) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span key={i} className="bg-yellow-200 text-yellow-900 font-bold px-0.5 rounded shadow-sm">{part}</span>
        ) : <span key={i}>{part}</span>
      )}
    </span>
  )
}

const Badge = ({ type }) => {
  const colors = {
    6: 'bg-blue-50 text-blue-700 border-blue-200',
    8: 'bg-purple-50 text-purple-700 border-purple-200',
    13: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    default: 'bg-slate-50 text-slate-600 border-slate-200'
  }
  const labels = { 6: 'Pregão', 8: 'Dispensa', 13: 'Concorrência' }
  return (
    <span className={`px-2 py-0.5 rounded text-xs font-semibold border ${colors[type] || colors.default}`}>
      {labels[type] || 'Outros'}
    </span>
  )
}

const enviarWhatsapp = (item) => {
  const valorFmt = item.valor > 0 ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sob consulta'
  const mensagem = `🏛️ *Oportunidade Pro!*\n\n*Objeto:* ${item.titulo}\n📍 *Local:* ${item.municipio}-${item.uf}\n💰 *Valor:* ${valorFmt}\n📅 *Prazo:* ${new Date(item.data_abertura).toLocaleDateString()}\n\n🔗 *Link:* ${item.link_edital || 'N/A'}`
  const url = `https://wa.me/?text=${encodeURIComponent(mensagem)}`
  window.open(url, '_blank')
}

// --- MODAL DETALHES ---
const ModalDetalhes = ({ licitacao, termoBusca, onClose, onUpdateStatus }) => {
  if (!licitacao) return null;

  const temArquivos = licitacao.arquivos && licitacao.arquivos.length > 0;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm transition-all">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] flex flex-col overflow-hidden animate-in fade-in zoom-in duration-200">

        {/* Cabeçalho */}
        <div className="p-6 border-b border-slate-100 flex justify-between items-start bg-slate-50/50">
          <div className="pr-8">
            <div className="flex gap-2 mb-3">
              <PrazoBadge dataAbertura={licitacao.data_abertura} />
              <Badge type={licitacao.modalidade_id} />
              {licitacao.municipio && <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"><MapPin size={10} /> {licitacao.municipio}-{licitacao.uf}</span>}
            </div>
            <h2 className="text-xl font-bold text-slate-800 leading-snug">
              {/* Se o título for genérico, avisa */}
              {licitacao.titulo === "Ver Edital" ? <span className="text-slate-400 italic">Objeto não detalhado no PNCP</span> : <Highlighter text={licitacao.titulo} highlight={termoBusca} />}
            </h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-slate-100 rounded-full text-slate-400"><X size={20} /></button>
        </div>

        {/* Corpo */}
        <div className="p-6 overflow-y-auto space-y-6">

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-blue-50/50 rounded-xl border border-blue-100">
              <p className="text-xs font-bold text-blue-600 uppercase mb-1">Valor Estimado</p>
              <p className="text-2xl font-bold text-slate-800">{licitacao.valor > 0 ? licitacao.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : 'Sigiloso'}</p>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-100">
              <p className="text-xs font-bold text-slate-400 uppercase mb-1">Data de Abertura</p>
              <div className="flex items-center gap-2 text-lg font-bold text-slate-700">
                <Calendar size={20} className="text-blue-500" />
                {licitacao.data_abertura ? new Date(licitacao.data_abertura).toLocaleDateString('pt-BR') : 'Não informada'}
              </div>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2"><FileText size={16} className="text-blue-500" /> Detalhes</h3>
            <div className="bg-slate-50 p-4 rounded-xl border border-slate-100 text-sm text-slate-600 leading-relaxed">
              <Highlighter text={licitacao.descricao || "Descrição detalhada disponível apenas no edital externo."} highlight={termoBusca} />
            </div>
          </div>

          {/* ARQUIVOS */}
          <div className="mt-4">
            <h3 className="text-sm font-bold text-slate-800 mb-2 flex items-center gap-2">
              <Paperclip size={16} className="text-blue-500" /> Arquivos e Anexos
            </h3>

            {temArquivos ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                {licitacao.arquivos.map((arq, idx) => (
                  <a key={idx} href={arq.url} target="_blank" rel="noopener noreferrer" className="flex items-center justify-between p-3 bg-slate-50 border border-slate-200 rounded-lg hover:bg-blue-50 hover:border-blue-200 transition-colors text-sm group">
                    <span className="truncate text-slate-600 font-medium group-hover:text-blue-700">{arq.titulo}</span>
                    <Download size={14} className="text-slate-400 group-hover:text-blue-500" />
                  </a>
                ))}
              </div>
            ) : (
              <div className="p-4 border border-dashed border-slate-300 rounded-lg bg-slate-50 text-center">
                <p className="text-sm text-slate-500">O órgão não disponibilizou arquivos diretos no PNCP.</p>
                {licitacao.link_edital && (
                  <p className="text-xs text-blue-600 font-medium mt-1">Utilize o botão "Ver Edital Externo" abaixo.</p>
                )}
              </div>
            )}
          </div>

        </div>

        {/* Rodapé */}
        <div className="p-6 border-t border-slate-100 bg-slate-50 flex justify-between items-center">
          <div className="flex gap-2">
            <button onClick={() => { onUpdateStatus(licitacao.id, 'analise', !licitacao.favorito); onClose(); }} className={`p-2.5 rounded-lg border ${licitacao.favorito ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-white text-slate-400 hover:border-amber-400'}`}><Star size={20} fill={licitacao.favorito ? "currentColor" : "none"} /></button>
            <button onClick={() => enviarWhatsapp(licitacao)} className="flex items-center gap-2 px-4 py-2.5 rounded-lg font-medium bg-green-50 text-green-700 border border-green-200 hover:bg-green-100"><MessageCircle size={18} /> Zap</button>
          </div>
          {licitacao.link_edital && <a href={licitacao.link_edital} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 px-6 py-2.5 rounded-lg font-bold text-white bg-blue-600 hover:bg-blue-700 shadow-md">Ver Edital Externo <ExternalLink size={18} /></a>}
        </div>
      </div>
    </div>
  )
}

// --- APP ---
function App() {
  const [licitacoes, setLicitacoes] = useState([])
  const [loading, setLoading] = useState(true)
  const [modalOpen, setModalOpen] = useState(null)

  const [busca, setBusca] = useState('')
  const [filtroUf, setFiltroUf] = useState('')
  const [filtroStatus, setFiltroStatus] = useState('novo')
  const [filtroValorMin, setFiltroValorMin] = useState('')

  async function carregarDados() {
    setLoading(true)
    try {
      let query = supabase
        .from('licitacoes')
        .select('*')
        .order('data_publicacao', { ascending: false }) // Idealmente ordenar por data_abertura asc
        .limit(100)

      if (busca) query = query.or(`titulo.ilike.%${busca}%,descricao.ilike.%${busca}%`)
      if (filtroUf) query = query.eq('uf', filtroUf)
      if (filtroValorMin) query = query.gte('valor', filtroValorMin)

      if (filtroStatus === 'favoritos') query = query.eq('favorito', true)
      else if (filtroStatus === 'descartados') query = query.eq('status', 'descartado')
      else query = query.neq('status', 'descartado')

      const { data, error } = await query
      if (error) throw error
      setLicitacoes(data)
    } catch (error) { console.error(error) } finally { setLoading(false) }
  }

  useEffect(() => {
    const timer = setTimeout(() => { carregarDados() }, 300)
    return () => clearTimeout(timer)
  }, [busca, filtroUf, filtroStatus, filtroValorMin])

  const atualizarStatus = async (id, novoStatus, favorito = null) => {
    setLicitacoes(prev => prev.map(item => item.id === id ? { ...item, status: novoStatus, favorito: favorito !== null ? favorito : item.favorito } : item))
    if (novoStatus === 'descartado' && filtroStatus !== 'descartados') setLicitacoes(prev => prev.filter(item => item.id !== id))
    const updates = { status: novoStatus }
    if (favorito !== null) updates.favorito = favorito
    await supabase.from('licitacoes').update(updates).eq('id', id)
  }

  return (
    <div className="flex h-screen bg-slate-50 text-slate-900 font-sans overflow-hidden">
      <aside className="w-64 bg-white border-r border-slate-200 flex flex-col z-10 shadow-sm hidden md:flex">
        <div className="p-6 flex items-center gap-2 border-b border-slate-100">
          <div className="bg-blue-600 p-1.5 rounded-lg"><Briefcase className="text-white w-5 h-5" /></div>
          <h1 className="font-bold text-xl tracking-tight text-slate-800">Licitamos <span className="text-blue-600">Pro</span></h1>
        </div>
        <nav className="flex-1 p-4 space-y-6 overflow-y-auto">
          <div>
            <p className="px-3 text-xs font-bold text-slate-400 uppercase tracking-wider mb-2">Fluxo</p>
            <button onClick={() => setFiltroStatus('novo')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${filtroStatus === 'novo' ? 'bg-blue-50 text-blue-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Briefcase size={18} /> Oportunidades</button>
            <button onClick={() => setFiltroStatus('favoritos')} className={`w-full flex items-center gap-3 px-3 py-2 rounded-md text-sm font-medium transition-all ${filtroStatus === 'favoritos' ? 'bg-amber-50 text-amber-700 shadow-sm' : 'text-slate-600 hover:bg-slate-50'}`}><Star size={18} /> Favoritos</button>
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
            <h2 className="text-2xl font-bold text-slate-800">{filtroStatus === 'novo' ? 'Novas Oportunidades' : filtroStatus === 'favoritos' ? 'Meus Favoritos' : 'Lixeira'}</h2>
            <p className="text-slate-500 text-sm mt-1">{loading ? 'Atualizando...' : `Mostrando ${licitacoes.length} itens`}</p>
          </div>
          <div className="relative w-96 group">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-5 h-5" />
            <input type="text" placeholder="Buscar (ex: pintura, café)..." className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:bg-white focus:ring-2 focus:ring-blue-500 outline-none transition-all" value={busca} onChange={(e) => setBusca(e.target.value)} />
          </div>
        </header>

        <div className="flex-1 overflow-y-auto p-6 bg-slate-50/50">
          <div className="max-w-5xl mx-auto space-y-4 pb-10">
            {licitacoes.map((item) => (
              <div key={item.id} onClick={() => setModalOpen(item)} className="bg-white rounded-xl border border-slate-200 shadow-sm hover:shadow-md hover:border-blue-300 transition-all duration-200 group cursor-pointer relative">
                <div className="p-5 flex flex-col md:flex-row gap-5">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      {/* --- NOVIDADE: BADGE DE PRAZO --- */}
                      <PrazoBadge dataAbertura={item.data_abertura} />
                      <Badge type={item.modalidade_id} />
                      {item.municipio && <span className="text-xs font-semibold text-slate-500 bg-white px-2 py-0.5 rounded border border-slate-200 flex items-center gap-1"><MapPin size={10} /> {item.municipio}-{item.uf}</span>}
                    </div>
                    <h3 className="text-lg font-bold text-slate-800 mb-2 leading-snug group-hover:text-blue-700 transition-colors"><Highlighter text={item.titulo} highlight={busca} /></h3>
                    <div className="flex items-center gap-2 text-sm text-slate-500 mb-3"><Building2 size={14} className="text-slate-400" /> <span className="font-medium">{item.orgao}</span></div>
                  </div>
                  <div className="flex flex-col justify-center items-end min-w-[150px] pl-4 md:border-l border-slate-100">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Valor Estimado</span>
                    <div className="text-xl font-bold text-slate-800 mt-1">{item.valor > 0 ? item.valor.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' }) : <span className="text-slate-400 text-base">Sigiloso</span>}</div>
                    <div className="flex gap-2 mt-3" onClick={(e) => e.stopPropagation()}>
                      <button onClick={() => enviarWhatsapp(item)} className="p-2 rounded-full border bg-slate-50 text-slate-400 hover:text-green-600 hover:bg-green-50 hover:border-green-200" title="Enviar no WhatsApp"><MessageCircle size={16} /></button>
                      <button onClick={() => atualizarStatus(item.id, 'analise', !item.favorito)} className={`p-2 rounded-full border ${item.favorito ? 'bg-amber-50 text-amber-500 border-amber-200' : 'bg-slate-50 text-slate-400 hover:text-amber-500 hover:border-amber-300'}`}><Star size={16} fill={item.favorito ? "currentColor" : "none"} /></button>
                      <button onClick={() => atualizarStatus(item.id, 'descartado')} className="p-2 rounded-full border bg-slate-50 text-slate-400 hover:text-red-500 hover:border-red-300"><XCircle size={16} /></button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
      {modalOpen && <ModalDetalhes licitacao={modalOpen} termoBusca={busca} onClose={() => setModalOpen(null)} onUpdateStatus={atualizarStatus} />}
    </div>
  )
}
export default App