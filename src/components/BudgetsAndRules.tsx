'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, cn } from '@/lib/utils';
import { Plus, Trash2, Zap } from 'lucide-react';

export default function BudgetsAndRules() {
  const { darkMode, categories, merchantRules, setMerchantRules, transactions, budgets, setBudgets } = useApp();
  const [newRulePattern, setNewRulePattern] = useState('');
  const [newRuleMerchant, setNewRuleMerchant] = useState('');
  const [newRuleCategory, setNewRuleCategory] = useState('Makanan & Minuman');

  const inputCls = cn('px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition', darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900');

  return (
    <div className="space-y-5">
      {/* Budget Guardrails */}
      <div className={cn('p-5 rounded-2xl border', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
        <div className="mb-5">
          <h2 className="font-bold text-base">Budget Guardrails</h2>
          <p className={cn('text-xs mt-0.5', darkMode ? 'text-slate-500' : 'text-slate-400')}>
            Ubah limit anggaran — notifikasi otomatis dikirim via bot saat 80% atau 100% tercapai.
          </p>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
          {budgets.map((b, idx) => {
            const spent = transactions.filter(t => t.type !== 'income' && t.category === b.category).reduce((acc, c) => acc + c.amount, 0);
            const rawPct = Math.round((spent / b.limit) * 100);
            const pct = Math.min(100, rawPct);
            const cat = categories.find(c => c.name === b.category);
            const barColor = rawPct >= 100 ? 'bg-rose-500' : rawPct >= 80 ? 'bg-amber-500' : 'bg-emerald-500';
            const textColor = rawPct >= 100 ? 'text-rose-400' : rawPct >= 80 ? 'text-amber-400' : 'text-emerald-400';

            return (
              <div key={b.category} className={cn('p-4 rounded-2xl border', darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200')}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="text-base">{cat?.icon || '📌'}</span>
                    <span className="font-semibold text-xs">{b.category}</span>
                  </div>
                  <span className={cn('text-xs font-mono font-bold px-2 py-0.5 rounded-lg', darkMode ? 'bg-slate-900' : 'bg-white', textColor)}>
                    {rawPct}%
                  </span>
                </div>
                <div className={cn('w-full h-1.5 rounded-full mb-3', darkMode ? 'bg-slate-800' : 'bg-slate-200')}>
                  <div className={cn('h-full rounded-full transition-all duration-500', barColor)} style={{ width: `${pct}%` }} />
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className={darkMode ? 'text-slate-500' : 'text-slate-400'}>{formatRupiah(spent)}</span>
                  <input
                    type="number" step={50000} value={b.limit}
                    onChange={e => { const val = Math.max(50000, Number(e.target.value)); setBudgets(p => p.map((item, i) => i === idx ? { ...item, limit: val } : item)); }}
                    className={cn('w-28 px-2 py-1 rounded-lg text-right text-xs font-mono font-bold border outline-none focus:ring-1 focus:ring-emerald-500', darkMode ? 'bg-slate-900 border-slate-800 text-white' : 'bg-white border-slate-300')}
                  />
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Merchant Rules */}
      <div className={cn('p-5 rounded-2xl border', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5">
          <div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4 text-amber-400" />
              <h2 className="font-bold text-base">Merchant Rules</h2>
            </div>
            <p className={cn('text-xs mt-0.5', darkMode ? 'text-slate-500' : 'text-slate-400')}>
              Rule-first pre-processor — menghemat panggilan AI jika pola cocok.
            </p>
          </div>
          {/* Add Rule */}
          <div className="flex flex-wrap gap-2">
            <input type="text" placeholder="Pattern (misal: starbucks)" value={newRulePattern} onChange={e => setNewRulePattern(e.target.value)} className={cn(inputCls, 'w-40')} />
            <input type="text" placeholder="Nama merchant" value={newRuleMerchant} onChange={e => setNewRuleMerchant(e.target.value)} className={cn(inputCls, 'w-36')} />
            <select value={newRuleCategory} onChange={e => setNewRuleCategory(e.target.value)} className={inputCls}>
              {categories.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
            </select>
            <button
              onClick={() => {
                if (!newRulePattern.trim()) return;
                setMerchantRules(p => [{ id: `rule-${Date.now()}`, pattern: newRulePattern.trim().toLowerCase(), merchantName: newRuleMerchant.trim() || newRulePattern.trim(), category: newRuleCategory, defaultPayment: 'QRIS', hits: 0 }, ...p]);
                setNewRulePattern(''); setNewRuleMerchant('');
              }}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition"
            >
              <Plus className="w-3.5 h-3.5" /> Tambah
            </button>
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2.5">
          {merchantRules.map(rule => (
            <div key={rule.id} className={cn('p-3 rounded-xl border flex items-center justify-between', darkMode ? 'bg-slate-950/60 border-slate-800' : 'bg-slate-50 border-slate-200')}>
              <div className="min-w-0">
                <div className="flex items-center gap-2">
                  <span className={cn('font-mono font-bold text-xs', 'text-emerald-400')}>"{rule.pattern}"</span>
                  <span className={cn('text-[10px] px-1.5 py-0.5 rounded-lg font-mono', darkMode ? 'bg-indigo-500/10 text-indigo-400' : 'bg-indigo-50 text-indigo-600')}>
                    {rule.hits} hits
                  </span>
                </div>
                <div className={cn('text-[11px] mt-0.5 truncate', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                  → {rule.category} ({rule.merchantName})
                </div>
              </div>
              <button onClick={() => setMerchantRules(p => p.filter(r => r.id !== rule.id))} className={cn('p-1.5 rounded-lg ml-2 transition shrink-0', darkMode ? 'hover:bg-rose-500/10 text-slate-600 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-400 hover:text-rose-500')}>
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
