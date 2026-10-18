'use client';
import { useApp } from '@/context/AppContext';
import { Sun, Moon, LayoutDashboard, ListOrdered, PieChart, MessageSquare, Settings, Download } from 'lucide-react';
import { cn } from '@/lib/utils';

const NAV_ITEMS = [
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { id: 'transactions', label: 'Transaksi', icon: ListOrdered },
  { id: 'budgets', label: 'Budget & Rules', icon: PieChart },
  { id: 'bot', label: 'Bot Simulator', icon: MessageSquare },
  { id: 'settings', label: 'Pengaturan', icon: Settings },
];

interface SidebarProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

export default function Sidebar({ activeTab, onTabChange }: SidebarProps) {
  const { darkMode, setDarkMode, transactions, merchantRules, metrics, exportToCSV } = useApp();

  return (
    <aside className={cn(
      'hidden lg:flex flex-col w-56 shrink-0 h-screen sticky top-0 border-r',
      darkMode ? 'bg-[#0a0d14] border-slate-800' : 'bg-white border-slate-200'
    )}>
      {/* Logo */}
      <div className="px-5 py-4 border-b border-slate-800/50">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs shadow-lg shadow-emerald-500/20">
            FB
          </div>
          <div>
            <div className="font-bold text-sm tracking-tight">FinBot AI</div>
            <div className={cn('text-[10px] font-mono', darkMode ? 'text-emerald-400' : 'text-emerald-600')}>
              v2.4 • active
            </div>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 p-3 space-y-0.5">
        {NAV_ITEMS.map(({ id, label, icon: Icon }) => (
          <button
            key={id}
            onClick={() => onTabChange(id)}
            className={cn(
              'w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-150',
              activeTab === id
                ? 'bg-emerald-500/10 text-emerald-400 shadow-sm'
                : darkMode
                ? 'text-slate-400 hover:text-slate-100 hover:bg-slate-800/60'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            )}
          >
            <Icon className="w-4 h-4 shrink-0" />
            <span>{label}</span>
          </button>
        ))}
      </nav>

      {/* Footer stats */}
      <div className={cn('p-4 border-t space-y-3', darkMode ? 'border-slate-800' : 'border-slate-200')}>
        <div className={cn('p-3 rounded-xl', darkMode ? 'bg-slate-900' : 'bg-slate-50')}>
          <div className={cn('text-[10px] font-mono uppercase mb-1', darkMode ? 'text-slate-500' : 'text-slate-400')}>
            Saving Rate
          </div>
          <div className={cn('text-lg font-black font-mono', metrics.savingsRatio >= 50 ? 'text-emerald-400' : 'text-amber-400')}>
            {metrics.savingsRatio}%
          </div>
          <div className="w-full h-1.5 bg-slate-800 rounded-full mt-1.5 overflow-hidden">
            <div
              className={cn('h-full rounded-full transition-all', metrics.savingsRatio >= 50 ? 'bg-emerald-400' : 'bg-amber-400')}
              style={{ width: `${Math.min(100, metrics.savingsRatio)}%` }}
            />
          </div>
        </div>

        <div className="flex items-center justify-between">
          <button onClick={() => setDarkMode(!darkMode)} className={cn('p-2 rounded-lg border transition', darkMode ? 'border-slate-800 text-slate-400 hover:text-amber-400' : 'border-slate-200 text-slate-500 hover:text-amber-600')}>
            {darkMode ? <Sun className="w-3.5 h-3.5" /> : <Moon className="w-3.5 h-3.5" />}
          </button>
          <button onClick={exportToCSV} className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium border transition', darkMode ? 'border-slate-800 text-slate-400 hover:text-emerald-400' : 'border-slate-200 text-slate-600 hover:text-emerald-600')}>
            <Download className="w-3 h-3" />
            CSV
          </button>
        </div>
      </div>
    </aside>
  );
}
