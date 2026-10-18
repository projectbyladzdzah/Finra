'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, cn } from '@/lib/utils';
import { ShieldCheck, Link2, Trash2, Plus, RefreshCw } from 'lucide-react';

export default function SettingsPanel() {
  const {
    darkMode, categories, setCategories, isAccountLinked,
    setIsAccountLinked, otpCode, setOtpCode, setMerchantRules,
    exportToCSV, handleClearAllTransactions
  } = useApp();
  const [newCatName, setNewCatName] = useState('');
  const [newCatIcon, setNewCatIcon] = useState('✨');
  const [newCatType, setNewCatType] = useState<'expense' | 'income'>('expense');

  const inputCls = cn('px-3 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition', darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900');

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
      {/* Bot Linking */}
      <div className={cn('p-5 rounded-2xl border space-y-4', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
        <div className="flex items-center gap-2">
          <Link2 className="w-4 h-4 text-emerald-400" />
          <h2 className="font-bold text-base">Tautkan Akun Bot</h2>
        </div>

        <div className={cn('p-4 rounded-2xl border', darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}>
          <p className={cn('text-[10px] font-mono uppercase mb-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>OTP Link Token (TTL 15m)</p>
          <div className="flex items-center justify-between">
            <span className={cn('text-2xl font-black font-mono tracking-widest', 'text-emerald-400')}>{otpCode}</span>
            <div className="flex gap-2">
              <button onClick={() => setOtpCode(String(Math.floor(100000 + Math.random() * 900000)))}
                className={cn('flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-mono border transition', darkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-slate-600' : 'bg-white border-slate-300 text-slate-600')}>
                <RefreshCw className="w-3 h-3" /> Baru
              </button>
              <button onClick={() => setIsAccountLinked(!isAccountLinked)}
                className={cn('px-3 py-1.5 rounded-xl text-xs font-mono font-bold transition', isAccountLinked ? 'bg-rose-500/15 text-rose-400 border border-rose-500/30 hover:bg-rose-500/25' : 'bg-emerald-600 hover:bg-emerald-500 text-white')}>
                {isAccountLinked ? 'Cabut Tautan' : 'Otorisasi'}
              </button>
            </div>
          </div>
          <p className={cn('text-xs mt-2', darkMode ? 'text-slate-500' : 'text-slate-400')}>
            Ketik <code className="font-mono px-1 rounded bg-black/20">/link {otpCode}</code> di chat bot untuk menghubungkan akun.
          </p>
        </div>

        {/* Create Category */}
        <div>
          <h3 className="font-semibold text-xs mb-2">Tambah Kategori Baru</h3>
          <div className="flex gap-2">
            <input type="text" value={newCatIcon} onChange={e => setNewCatIcon(e.target.value)} className={cn(inputCls, 'w-12 text-center')} />
            <input type="text" placeholder="Nama kategori..." value={newCatName} onChange={e => setNewCatName(e.target.value)} className={cn(inputCls, 'flex-1')} />
            <select value={newCatType} onChange={e => setNewCatType(e.target.value as 'expense'|'income')} className={inputCls}>
              <option value="expense">Pengeluaran</option>
              <option value="income">Pemasukan</option>
            </select>
            <button onClick={() => {
              if (!newCatName.trim()) return;
              setCategories(p => [...p, { id: `cat-${Date.now()}`, name: newCatName.trim(), type: newCatType, icon: newCatIcon || '✨', color: '#06b6d4' }]);
              setNewCatName('');
            }} className="flex items-center gap-1 px-3 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold transition">
              <Plus className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Category list */}
        <div className="grid grid-cols-2 gap-1.5 max-h-48 overflow-y-auto">
          {categories.map(c => (
            <div key={c.id} className={cn('px-2.5 py-1.5 rounded-xl border flex items-center justify-between text-xs', darkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-200')}>
              <span>{c.icon} {c.name}</span>
              <button onClick={() => setCategories(p => p.filter(cat => cat.id !== c.id))}
                className={cn('text-slate-600 hover:text-rose-400 transition p-0.5')}>
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Security & Data */}
      <div className={cn('p-5 rounded-2xl border space-y-4', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm')}>
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-indigo-400" />
          <h2 className="font-bold text-base">Keamanan & Data</h2>
        </div>

        <ul className={cn('space-y-2 text-xs font-mono', darkMode ? 'text-slate-400' : 'text-slate-500')}>
          {[
            '✓ Webhook Signature Verification (HMAC-SHA256)',
            '✓ Row-Level Security scoped by user_id (PostgreSQL)',
            '✓ S3 Pre-signed URLs untuk foto struk (zero public leak)',
            '✓ Auto-purge draft setelah 24 jam (Redis TTL)',
          ].map((item, i) => <li key={i}>{item}</li>)}
        </ul>

        <div className={cn('pt-4 border-t space-y-2', darkMode ? 'border-slate-800' : 'border-slate-200')}>
          <button onClick={exportToCSV}
            className="w-full py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition">
            📥 Export Ledger ke CSV
          </button>
          <button onClick={async () => {
            if (window.confirm('Hapus semua data transaksi dan aturan? Ini tidak dapat dibatalkan.')) {
              await handleClearAllTransactions();
              setMerchantRules(() => []);
            }
          }}
            className={cn('w-full py-2.5 rounded-xl text-xs font-semibold border transition', darkMode ? 'bg-rose-500/10 border-rose-500/20 text-rose-400 hover:bg-rose-500/20' : 'bg-rose-50 border-rose-200 text-rose-600 hover:bg-rose-100')}>
            🗑️ Hapus Semua Data (Neon DB Purge)
          </button>
        </div>

        {/* Tech stack info */}
        <div className={cn('p-3 rounded-xl border', darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}>
          <p className={cn('text-[10px] font-mono font-bold uppercase mb-2', darkMode ? 'text-slate-500' : 'text-slate-400')}>Tech Stack</p>
          <div className="grid grid-cols-2 gap-1 text-[11px] font-mono">
            {[['Backend', 'Node.js + Express'], ['AI', 'Claude 3.5 Vision / Gemini'], ['DB', 'PostgreSQL 16 + Prisma'], ['Queue', 'BullMQ + Redis 7'], ['Storage', 'MinIO (S3)'], ['Bot', 'Telegram grammY / WA Meta']].map(([k, v]) => (
              <div key={k}>
                <span className={darkMode ? 'text-slate-600' : 'text-slate-400'}>{k}: </span>
                <span className={darkMode ? 'text-slate-300' : 'text-slate-700'}>{v}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
