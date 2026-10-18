'use client';
import { useState, useMemo } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, cn } from '@/lib/utils';
import { Search, Edit3, Trash2, Eye, Download, X, Check } from 'lucide-react';
import type { Transaction } from '@/lib/types';

export default function TransactionList() {
  const { darkMode, transactions, categories, setTransactions, exportToCSV, editingTxModal, setEditingTxModal, commitTransactionEdit } = useApp();
  const [searchQuery, setSearchQuery] = useState('');
  const [filterCategory, setFilterCategory] = useState('ALL');
  const [filterType, setFilterType] = useState('ALL');

  const filtered = useMemo(() => transactions.filter(t => {
    if (filterCategory !== 'ALL' && t.category !== filterCategory) return false;
    if (filterType !== 'ALL' && t.type !== filterType) return false;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return t.description?.toLowerCase().includes(q) || t.merchant?.toLowerCase().includes(q) || t.category?.toLowerCase().includes(q);
    }
    return true;
  }), [transactions, filterCategory, filterType, searchQuery]);

  const inputCls = cn('px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition', darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900');

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className={cn('p-4 rounded-2xl border', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
        <div className="flex flex-col sm:flex-row gap-2">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 opacity-40" />
            <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)}
              placeholder="Cari deskripsi atau merchant..." className={cn(inputCls, 'pl-8 w-full')} />
          </div>
          <select value={filterCategory} onChange={e => setFilterCategory(e.target.value)} className={inputCls}>
            <option value="ALL">Semua Kategori</option>
            {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
          </select>
          <select value={filterType} onChange={e => setFilterType(e.target.value)} className={inputCls}>
            <option value="ALL">Semua Tipe</option>
            <option value="expense">Pengeluaran</option>
            <option value="income">Pemasukan</option>
            <option value="transfer">Transfer</option>
          </select>
          <button onClick={exportToCSV} className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition shrink-0">
            <Download className="w-3.5 h-3.5" />
            CSV
          </button>
        </div>
        <p className={cn('text-[11px] mt-2', darkMode ? 'text-slate-600' : 'text-slate-400')}>
          {filtered.length} dari {transactions.length} transaksi
        </p>
      </div>

      {/* Table */}
      <div className={cn('rounded-2xl border overflow-hidden', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
        <div className="overflow-x-auto">
          <table className="w-full text-xs">
            <thead>
              <tr className={cn('border-b', darkMode ? 'border-slate-800 bg-slate-950/50' : 'border-slate-200 bg-slate-50')}>
                {['Tanggal', 'Deskripsi', 'Kategori', 'Metode', 'Nominal', 'Aksi'].map(h => (
                  <th key={h} className={cn('py-3 px-4 text-left text-[10px] font-semibold uppercase tracking-wider', darkMode ? 'text-slate-500' : 'text-slate-400')}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className={cn('divide-y', darkMode ? 'divide-slate-800/50' : 'divide-slate-100')}>
              {filtered.map(tx => {
                const cat = categories.find(c => c.name === tx.category);
                return (
                  <tr key={tx.id} className={cn('transition group', darkMode ? 'hover:bg-slate-900/50' : 'hover:bg-slate-50')}>
                    <td className={cn('py-3 px-4 font-mono text-[10px] whitespace-nowrap', darkMode ? 'text-slate-500' : 'text-slate-400')}>{tx.date}</td>
                    <td className="py-3 px-4">
                      <div className="font-medium max-w-[200px] truncate">{tx.description}</div>
                      <div className={cn('text-[10px] font-mono mt-0.5', darkMode ? 'text-slate-600' : 'text-slate-400')}>
                        {tx.merchant || 'Direct'} • {Math.round((tx.confidence||1)*100)}%
                      </div>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('inline-flex items-center gap-1.5 px-2 py-1 rounded-lg text-[11px] font-medium', darkMode ? 'bg-slate-900 border border-slate-800' : 'bg-slate-100')}>
                        {cat?.icon || '📌'} {tx.category}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <span className={cn('px-2 py-0.5 rounded-lg font-mono text-[10px]', darkMode ? 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20' : 'bg-indigo-50 text-indigo-600 border border-indigo-200')}>
                        {tx.payment_method || '-'}
                      </span>
                    </td>
                    <td className={cn('py-3 px-4 font-mono font-bold whitespace-nowrap', tx.type === 'income' ? 'text-emerald-400' : tx.type === 'transfer' ? 'text-sky-400' : 'text-rose-400')}>
                      {tx.type === 'income' ? '+' : '-'}{formatRupiah(tx.amount)}
                    </td>
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                        <button onClick={() => setEditingTxModal(tx)} className={cn('p-1.5 rounded-lg transition', darkMode ? 'hover:bg-slate-800 text-slate-400 hover:text-white' : 'hover:bg-slate-200 text-slate-500')}>
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                        <button onClick={() => setTransactions(p => p.filter(i => i.id !== tx.id))} className={cn('p-1.5 rounded-lg transition', darkMode ? 'hover:bg-rose-500/10 text-slate-400 hover:text-rose-400' : 'hover:bg-rose-50 text-slate-500 hover:text-rose-500')}>
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {filtered.length === 0 && (
            <div className={cn('py-12 text-center text-sm', darkMode ? 'text-slate-600' : 'text-slate-400')}>
              Tidak ada transaksi yang sesuai
            </div>
          )}
        </div>
      </div>

      {/* Edit Modal */}
      {editingTxModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4" onClick={() => setEditingTxModal(null)}>
          <div onClick={e => e.stopPropagation()} className={cn('w-full max-w-md rounded-2xl border p-5 space-y-4', darkMode ? 'bg-slate-900 border-slate-700' : 'bg-white border-slate-200')}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-sm">Edit Transaksi</h3>
              <button onClick={() => setEditingTxModal(null)}><X className="w-4 h-4" /></button>
            </div>
            <div>
              <label className={cn('block text-xs mb-1', darkMode ? 'text-slate-400' : 'text-slate-500')}>Deskripsi</label>
              <input type="text" value={editingTxModal.description}
                onChange={e => setEditingTxModal({...editingTxModal, description: e.target.value})}
                className={cn('w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-1 focus:ring-emerald-500', darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300')} />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className={cn('block text-xs mb-1', darkMode ? 'text-slate-400' : 'text-slate-500')}>Nominal (IDR)</label>
                <input type="number" value={editingTxModal.amount}
                  onChange={e => setEditingTxModal({...editingTxModal, amount: Number(e.target.value)})}
                  className={cn('w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-1 focus:ring-emerald-500', darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300')} />
              </div>
              <div>
                <label className={cn('block text-xs mb-1', darkMode ? 'text-slate-400' : 'text-slate-500')}>Kategori</label>
                <select value={editingTxModal.category}
                  onChange={e => setEditingTxModal({...editingTxModal, category: e.target.value})}
                  className={cn('w-full px-3 py-2 rounded-xl border text-sm outline-none focus:ring-1 focus:ring-emerald-500', darkMode ? 'bg-slate-800 border-slate-700' : 'bg-slate-50 border-slate-300')}>
                  {categories.map(c => <option key={c.id} value={c.name}>{c.icon} {c.name}</option>)}
                </select>
              </div>
            </div>
            <button onClick={() => commitTransactionEdit(editingTxModal)}
              className="w-full py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-sm transition flex items-center justify-center gap-2">
              <Check className="w-4 h-4" /> Simpan Perubahan
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
