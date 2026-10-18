'use client';
import { useApp } from '@/context/AppContext';
import { formatRupiah, cn } from '@/lib/utils';
import { Wallet, TrendingUp, TrendingDown, Zap, RefreshCw, Sparkles } from 'lucide-react';
import { ResponsiveContainer, PieChart, Pie, Cell, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend } from 'recharts';
import { useState } from 'react';

function StatCard({ label, value, sub, icon: Icon, color }: { label: string; value: string; sub: string; icon: any; color: string }) {
  const { darkMode } = useApp();
  return (
    <div className={cn('p-4 rounded-2xl border transition-all', darkMode ? 'bg-[#0d1117] border-slate-800/80 hover:border-slate-700' : 'bg-white border-slate-200 shadow-sm hover:shadow-md')}>
      <div className="flex items-start justify-between">
        <div>
          <p className={cn('text-xs font-medium mb-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>{label}</p>
          <p className={cn('text-xl font-black font-mono tracking-tight', color)}>{value}</p>
          <p className={cn('text-[11px] mt-1', darkMode ? 'text-slate-600' : 'text-slate-400')}>{sub}</p>
        </div>
        <div className={cn('p-2 rounded-xl', darkMode ? 'bg-slate-800' : 'bg-slate-100')}>
          <Icon className={cn('w-4 h-4', color)} />
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const { darkMode, metrics, transactions, merchantRules } = useApp();
  const [aiInsight, setAiInsight] = useState(
    `Rasio tabungan bulan ini berada di ${metrics.savingsRatio}% — ${metrics.savingsRatio >= 50 ? 'sangat optimal' : 'perlu perhatian'}. ${metrics.categoryChartData[0] ? `Pengeluaran terbesar di kategori ${metrics.categoryChartData[0].name} (${formatRupiah(metrics.categoryChartData[0].value)}).` : ''}`
  );
  const [generating, setGenerating] = useState(false);

  const recompute = () => {
    setGenerating(true);
    setTimeout(() => {
      const top = metrics.categoryChartData[0];
      setAiInsight(`Burn rate harian Anda ${formatRupiah(metrics.dailyBurnRate)}/hari. Kategori ${top?.name || '-'} menyumbang ${formatRupiah(top?.value || 0)} dari total pengeluaran. Rule engine menghemat ~${merchantRules.reduce((a,r)=>a+r.hits,0)} panggilan AI.`);
      setGenerating(false);
    }, 600);
  };

  return (
    <div className="space-y-5">
      {/* KPI Cards */}
      <div className="grid grid-cols-2 xl:grid-cols-4 gap-3">
        <StatCard label="Net Cashflow" value={formatRupiah(metrics.balance)} sub={`${metrics.savingsRatio}% tersimpan`} icon={Wallet} color={metrics.balance >= 0 ? 'text-emerald-400' : 'text-rose-400'} />
        <StatCard label="Pemasukan" value={formatRupiah(metrics.income)} sub={`${transactions.filter(t=>t.type==='income').length} transaksi`} icon={TrendingUp} color="text-green-400" />
        <StatCard label="Pengeluaran" value={formatRupiah(metrics.expense)} sub={`${transactions.filter(t=>t.type!=='income').length} transaksi`} icon={TrendingDown} color="text-rose-400" />
        <StatCard label="Rule Hits" value={`${metrics.totalRuleHits}x`} sub={`${merchantRules.length} aturan aktif`} icon={Zap} color="text-amber-400" />
      </div>

      {/* AI Insight Banner */}
      <div className={cn('p-4 rounded-2xl border flex items-start justify-between gap-4', darkMode ? 'bg-gradient-to-r from-emerald-950/40 to-indigo-950/30 border-emerald-800/30' : 'bg-emerald-50 border-emerald-200')}>
        <div className="flex items-start gap-3">
          <div className={cn('p-2 rounded-xl shrink-0', darkMode ? 'bg-emerald-500/10' : 'bg-emerald-100')}>
            <Sparkles className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <p className={cn('text-[10px] font-mono uppercase font-bold mb-1', 'text-emerald-400')}>AI Financial Insight</p>
            <p className={cn('text-xs leading-relaxed', darkMode ? 'text-slate-300' : 'text-slate-700')}>{aiInsight}</p>
          </div>
        </div>
        <button onClick={recompute} className="px-3 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 shrink-0 transition">
          <RefreshCw className={cn('w-3 h-3', generating && 'animate-spin')} />
          Perbarui
        </button>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-4">
        {/* Donut */}
        <div className={cn('lg:col-span-2 p-4 rounded-2xl border', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-4', darkMode ? 'text-slate-400' : 'text-slate-500')}>
            Alokasi Pengeluaran
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie data={metrics.categoryChartData} dataKey="value" nameKey="name" cx="50%" cy="50%" innerRadius={46} outerRadius={74} paddingAngle={3}>
                  {metrics.categoryChartData.map((entry, i) => <Cell key={i} fill={entry.color} />)}
                </Pie>
                <Tooltip formatter={(v: any) => formatRupiah(v)} contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Bar Chart */}
        <div className={cn('lg:col-span-3 p-4 rounded-2xl border', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
          <h3 className={cn('text-xs font-semibold uppercase tracking-wider mb-4', darkMode ? 'text-slate-400' : 'text-slate-500')}>
            Cashflow Harian
          </h3>
          <div className="h-52">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={metrics.dailyTrendData}>
                <CartesianGrid strokeDasharray="3 3" stroke={darkMode ? '#1e293b' : '#e2e8f0'} />
                <XAxis dataKey="date" stroke="#64748b" fontSize={10} />
                <YAxis stroke="#64748b" fontSize={10} tickFormatter={v => `${Math.round(v/1000)}k`} />
                <Tooltip formatter={(v: any) => formatRupiah(v)} contentStyle={{ backgroundColor: '#0d1117', borderColor: '#1e293b', borderRadius: '12px', fontSize: '11px' }} />
                <Legend wrapperStyle={{ fontSize: '11px' }} />
                <Bar dataKey="Pemasukan" fill="#10b981" radius={[4,4,0,0]} />
                <Bar dataKey="Pengeluaran" fill="#f43f5e" radius={[4,4,0,0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
}
