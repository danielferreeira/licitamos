import { useState, useEffect } from 'react'
import { api } from '../services/api'
import { TrendingUp, TrendingDown, Target, DollarSign, PieChart, PlusCircle } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell, Pie, Legend, PieChart as RePieChart } from 'recharts'
import { useTheme } from '../contexts/ThemeContext'
import { toast } from 'sonner'

// Cores do gráfico
const COLORS = {
  green: '#10b981', // emerald-500
  red: '#ef4444',   // red-500
  blue: '#3b82f6',  // blue-500
}

export function Financial() {
  const { theme } = useTheme()
  const [loading, setLoading] = useState(true)
  
  // Estado inicial zerado
  const [stats, setStats] = useState({
    won: { value: 0, count: 0 },
    potential: { value: 0, count: 0 },
    lost: { value: 0, count: 0 }
  })

  useEffect(() => { loadFinancialData() }, [])

  async function loadFinancialData() {
    setLoading(true)
    try {
      const data = await api.getFinancialSummary()
      if (data) setStats(data)
    } catch (error) {
      console.error(error)
      toast.error("Erro ao carregar financeiro.")
    } finally {
      setLoading(false)
    }
  }

  // Prepara dados para os gráficos
  const chartData = [
    { name: 'Ganho', value: stats.won.value, color: COLORS.green },
    { name: 'Perdido', value: stats.lost.value, color: COLORS.red },
    { name: 'No Funil', value: stats.potential.value, color: COLORS.blue },
  ]

  const pieData = [
    { name: 'Em Aberto', value: stats.potential.count, color: COLORS.blue },
    { name: 'Ganhas', value: stats.won.count, color: COLORS.green },
    { name: 'Perdidas', value: stats.lost.count, color: COLORS.red },
  ].filter(item => item.value > 0) // Esconde fatias zeradas

  const formatMoney = (value) => value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
  
  const axisColor = theme === 'dark' ? '#94a3b8' : '#64748b'
  const tooltipStyle = theme === 'dark' 
    ? { backgroundColor: '#1e293b', border: '1px solid #334155', color: '#fff' } 
    : { backgroundColor: '#fff', border: '1px solid #e2e8f0', color: '#1e293b' }

  return (
    <div className="max-w-7xl mx-auto pb-10 animate-fade-in">
      <div className="flex justify-between items-center mb-2">
        <h1 className="text-2xl font-bold text-slate-900 dark:text-white">Resultados Financeiros</h1>
    
      </div>
      <p className="text-slate-500 dark:text-slate-400 mb-8">Acompanhe o desempenho das suas licitações.</p>

      {/* CARDS DE KPI */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        {/* Card Ganho */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Total Ganho</p>
            <h3 className="text-2xl font-bold text-emerald-600 dark:text-emerald-400">{formatMoney(stats.won.value)}</h3>
            <p className="text-xs text-emerald-600/80 dark:text-emerald-400/80 mt-1 font-medium">{stats.won.count} contratos</p>
          </div>
          <div className="p-3 bg-emerald-50 dark:bg-emerald-500/10 rounded-xl text-emerald-600 dark:text-emerald-400">
            <TrendingUp size={24}/>
          </div>
        </div>

        {/* Card Em Disputa */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Em Disputa (Potencial)</p>
            <h3 className="text-2xl font-bold text-blue-600 dark:text-blue-400">{formatMoney(stats.potential.value)}</h3>
            <p className="text-xs text-blue-600/80 dark:text-blue-400/80 mt-1 font-medium">{stats.potential.count} oportunidades</p>
          </div>
          <div className="p-3 bg-blue-50 dark:bg-blue-500/10 rounded-xl text-blue-600 dark:text-blue-400">
            <Target size={24}/>
          </div>
        </div>

        {/* Card Perdido */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm flex items-start justify-between">
          <div>
            <p className="text-xs font-bold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-1">Perdido</p>
            <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">{formatMoney(stats.lost.value)}</h3>
            <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 font-medium">{stats.lost.count} disputas</p>
          </div>
          <div className="p-3 bg-red-50 dark:bg-red-500/10 rounded-xl text-red-600 dark:text-red-400">
            <TrendingDown size={24}/>
          </div>
        </div>
      </div>

      {/* GRÁFICOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        
        {/* Gráfico de Barras */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
          <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <DollarSign size={18} className="text-slate-400"/> Volume Financeiro (R$)
          </h3>
          <div className="h-64 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke={theme === 'dark' ? '#334155' : '#e2e8f0'} />
                <XAxis 
                  dataKey="name" 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: axisColor, fontSize: 12 }}
                  dy={10}
                />
                <YAxis 
                  axisLine={false} 
                  tickLine={false} 
                  tick={{ fill: axisColor, fontSize: 12 }}
                  tickFormatter={(val) => `R$${val/1000}k`}
                />
                <Tooltip 
                  cursor={{ fill: theme === 'dark' ? '#334155' : '#f1f5f9' }}
                  contentStyle={tooltipStyle}
                  formatter={(value) => formatMoney(value)}
                />
                <Bar dataKey="value" radius={[4, 4, 0, 0]}>
                  {chartData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Gráfico de Pizza */}
        <div className="bg-white dark:bg-slate-800 p-6 rounded-2xl border border-slate-100 dark:border-slate-700 shadow-sm">
           <h3 className="font-bold text-slate-800 dark:text-white mb-6 flex items-center gap-2">
            <PieChart size={18} className="text-slate-400"/> Quantidade de Disputas
          </h3>
          <div className="h-64 w-full flex items-center justify-center">
             {pieData.length > 0 ? (
               <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} stroke={theme === 'dark' ? '#1e293b' : '#fff'} strokeWidth={2} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={tooltipStyle} />
                    <Legend 
                      verticalAlign="bottom" 
                      height={36}
                      formatter={(value) => <span style={{ color: axisColor }}>{value}</span>}
                    />
                  </RePieChart>
               </ResponsiveContainer>
             ) : (
                <div className="text-slate-400 text-sm flex flex-col items-center">
                  <PieChart size={32} className="mb-2 opacity-50"/>
                  Sem dados para exibir
                </div>
             )}
          </div>
        </div>

      </div>
    </div>
  )
}