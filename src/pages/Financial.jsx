import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, PieChart, Pie, Cell, Legend } from 'recharts'
import { Filter, Calendar, TrendingUp, TrendingDown, DollarSign, Award, Search, ArrowUpRight, ArrowDownLeft } from 'lucide-react'
import { formatCurrency } from '../utils/formatters'
import { format, getYear, getMonth, parseISO } from 'date-fns'
import { ptBR } from 'date-fns/locale'

const COLORS = ['#10b981', '#ef4444', '#3b82f6', '#f59e0b', '#8b5cf6']

export function Financial() {
  const [bids, setBids] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState('all')
  const [searchTerm, setSearchTerm] = useState('')

  useEffect(() => {
    api.getBids().then(data => { setBids(data || []); setLoading(false) })
  }, [])

  // --- 1. LÓGICA DO BI (FILTROS E DADOS) ---
  const filteredBids = bids.filter(bid => {
    if (!bid.deadline) return false
    const date = parseISO(bid.deadline)
    const yearMatch = getYear(date) === Number(selectedYear)
    const monthMatch = selectedMonth === 'all' ? true : getMonth(date) === Number(selectedMonth)
    // Filtro de texto para a tabela
    const searchMatch = searchTerm === '' ? true : 
      bid.clients?.company_name?.toLowerCase().includes(searchTerm.toLowerCase()) || 
      bid.title?.toLowerCase().includes(searchTerm.toLowerCase())
    
    return yearMatch && monthMatch && searchMatch
  })

  // KPIs
  const totalWon = filteredBids.filter(b => b.status === 'Ganha').reduce((acc, b) => acc + Number(b.value), 0)
  const totalLost = filteredBids.filter(b => b.status === 'Perdida').reduce((acc, b) => acc + Number(b.value), 0)
  const countWon = filteredBids.filter(b => b.status === 'Ganha').length

  // Dados para Gráfico de Área (Evolução)
  const monthlyData = Array.from({ length: 12 }, (_, i) => {
    const monthName = format(new Date(selectedYear, i, 1), 'MMM', { locale: ptBR })
    const monthBids = bids.filter(b => {
      if(!b.deadline) return false
      const d = parseISO(b.deadline)
      return getYear(d) === Number(selectedYear) && getMonth(d) === i
    })
    return {
      name: monthName,
      Receita: monthBids.filter(b => b.status === 'Ganha').reduce((acc, b) => acc + Number(b.value), 0),
    }
  })

  // Dados para Gráfico de Pizza (Status)
  const pieData = [
    { name: 'Ganha', value: filteredBids.filter(b => b.status === 'Ganha').length, color: '#10b981' },
    { name: 'Perdida', value: filteredBids.filter(b => b.status === 'Perdida').length, color: '#ef4444' },
    { name: 'Em Andamento', value: filteredBids.filter(b => !['Ganha', 'Perdida'].includes(b.status)).length, color: '#3b82f6' }
  ].filter(i => i.value > 0)

  const availableYears = [...new Set(bids.map(b => b.deadline ? getYear(parseISO(b.deadline)) : new Date().getFullYear()))].sort((a,b) => b - a)

  return (
    <div className="max-w-5xl mx-auto pb-10 animate-fade-in">
      
      {/* HEADER E FILTROS */}
      <div className="flex flex-col md:flex-row justify-between items-end mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900 dark:text-white mb-2">Financeiro</h1>
          <p className="text-slate-500 dark:text-slate-400 mb-8">Gestão de fluxo de caixa e performance.</p>
        </div>
        <div className="flex bg-white dark:bg-slate-800 p-1.5 rounded-xl border border-slate-200 dark:border-slate-700 shadow-sm gap-2">
           <div className="relative"><select className="appearance-none bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white pl-8 pr-8 py-2 rounded-lg text-sm font-bold outline-none" value={selectedYear} onChange={e => setSelectedYear(Number(e.target.value))}>{availableYears.map(y => <option key={y} value={y}>{y}</option>)}</select><Calendar size={14} className="absolute left-2.5 top-3 text-slate-500"/></div>
           <div className="relative"><select className="appearance-none bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-white pl-8 pr-8 py-2 rounded-lg text-sm font-bold outline-none" value={selectedMonth} onChange={e => setSelectedMonth(e.target.value)}><option value="all">Ano Inteiro</option>{Array.from({ length: 12 }, (_, i) => (<option key={i} value={i}>{format(new Date(2024, i, 1), 'MMMM', { locale: ptBR })}</option>))}</select><Filter size={14} className="absolute left-2.5 top-3 text-slate-500"/></div>
        </div>
      </div>

      {/* --- SEÇÃO BI (DASHBOARD) --- */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5"><TrendingUp size={80}/></div>
            <p className="text-xs font-bold text-slate-500 uppercase">Faturamento Realizado</p>
            <h3 className="text-2xl font-bold text-emerald-600">{formatCurrency(totalWon)}</h3>
            <div className="mt-2 text-xs text-emerald-700 bg-emerald-50 w-fit px-2 py-1 rounded flex items-center gap-1"><Award size={12}/> {countWon} Contratos</div>
         </div>
         <div className="bg-white dark:bg-slate-800 p-5 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm relative overflow-hidden">
            <div className="absolute right-0 top-0 p-4 opacity-5"><TrendingDown size={80}/></div>
            <p className="text-xs font-bold text-slate-500 uppercase">Volume Perdido</p>
            <h3 className="text-2xl font-bold text-red-600">{formatCurrency(totalLost)}</h3>
            <p className="text-xs text-slate-400 mt-2">Oportunidades não convertidas</p>
         </div>
         {/* Mini Gráfico de Status */}
         <div className="bg-white dark:bg-slate-800 p-2 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-center justify-center">
            <div className="h-24 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={pieData} cx="50%" cy="50%" innerRadius={30} outerRadius={40} dataKey="value">
                    {pieData.map((entry, index) => <Cell key={index} fill={entry.color} stroke="none"/>)}
                  </Pie>
                  <Tooltip />
                  <Legend layout="vertical" verticalAlign="middle" align="right" iconType="circle" wrapperStyle={{fontSize: '10px'}}/>
                </PieChart>
              </ResponsiveContainer>
            </div>
         </div>
      </div>

      <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm mb-8">
        <h3 className="font-bold text-slate-800 dark:text-white mb-4 flex items-center gap-2"><TrendingUp size={18} className="text-brand-green"/> Evolução de Receita ({selectedYear})</h3>
        <div className="h-64 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={monthlyData}>
              <defs><linearGradient id="colorRec" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#10b981" stopOpacity={0.2}/><stop offset="95%" stopColor="#10b981" stopOpacity={0}/></linearGradient></defs>
              <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.1}/><XAxis dataKey="name" axisLine={false} tickLine={false} fontSize={12}/><YAxis axisLine={false} tickLine={false} fontSize={12} tickFormatter={v => `R$${v/1000}k`}/><Tooltip formatter={v => formatCurrency(v)}/><Area type="monotone" dataKey="Receita" stroke="#10b981" fillOpacity={1} fill="url(#colorRec)" strokeWidth={3}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* --- SEÇÃO OPERACIONAL (EXTRATO / LISTA) --- */}
      <div className="bg-white dark:bg-slate-800 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-sm flex flex-col overflow-hidden">
         <div className="p-4 border-b border-slate-100 dark:border-slate-700 flex flex-col md:flex-row justify-between items-center gap-4">
            <h3 className="font-bold text-lg text-slate-800 dark:text-white flex items-center gap-2">Extrato de Licitações</h3>
            <div className="relative w-full md:w-64">
               <Search className="absolute left-3 top-2.5 text-slate-400" size={18}/>
               <input className="w-full bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700 rounded-xl pl-10 pr-4 py-2 text-sm outline-none focus:ring-2 focus:ring-brand-green dark:text-white" placeholder="Buscar lançamento..." value={searchTerm} onChange={e => setSearchTerm(e.target.value)}/>
            </div>
         </div>
         
         <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead className="bg-slate-50 dark:bg-slate-900/50 sticky top-0 z-10">
                <tr>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Data</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Cliente</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Descrição</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase">Status</th>
                  <th className="p-4 text-xs font-bold text-slate-500 uppercase text-right">Valor</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700">
                {filteredBids.length === 0 ? (
                   <tr><td colSpan="5" className="p-10 text-center text-slate-400">Nenhum registro encontrado no período.</td></tr>
                ) : (
                  filteredBids.map(bid => (
                    <tr key={bid.id} className="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition">
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-300">
                        {bid.deadline ? format(parseISO(bid.deadline), 'dd/MM/yyyy') : '-'}
                      </td>
                      <td className="p-4 text-sm font-bold text-slate-700 dark:text-slate-200">
                        {bid.clients?.company_name}
                      </td>
                      <td className="p-4 text-sm text-slate-600 dark:text-slate-400 max-w-xs truncate">
                        {bid.title}
                      </td>
                      <td className="p-4">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold flex w-fit items-center gap-1 ${
                          bid.status === 'Ganha' ? 'bg-emerald-100 text-emerald-700' : 
                          bid.status === 'Perdida' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'
                        }`}>
                          {bid.status === 'Ganha' ? <ArrowUpRight size={12}/> : bid.status === 'Perdida' ? <ArrowDownLeft size={12}/> : null}
                          {bid.status}
                        </span>
                      </td>
                      <td className="p-4 text-right font-mono font-medium text-slate-700 dark:text-slate-300">
                        {formatCurrency(bid.value)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
         </div>
      </div>
    </div>
  )
}