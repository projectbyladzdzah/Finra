'use client';
import { useState } from 'react';
import { useApp } from '@/context/AppContext';
import { cn } from '@/lib/utils';
import Sidebar from '@/components/Sidebar';
import Dashboard from '@/components/Dashboard';
import TransactionList from '@/components/TransactionList';
import BudgetsAndRules from '@/components/BudgetsAndRules';
import BotSimulator from '@/components/BotSimulator';
import SettingsPanel from '@/components/SettingsPanel';
import { LayoutDashboard, ListOrdered, PieChart, MessageSquare, Settings, Menu, X } from 'lucide-react';

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  transactions: 'Transaksi',
  budgets: 'Budget & Rules',
  bot: 'Bot Simulator',
  settings: 'Pengaturan',
};

const NAV_ITEMS = [
  { id: 'dashboard', icon: LayoutDashboard },
  { id: 'transactions', icon: ListOrdered },
  { id: 'budgets', icon: PieChart },
  { id: 'bot', icon: MessageSquare },
  { id: 'settings', icon: Settings },
];

export default function Home() {
  const { darkMode, transactions, messages } = useApp();
  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const renderContent = () => {
    switch (activeTab) {
      case 'dashboard': return <Dashboard />;
      case 'transactions': return <TransactionList />;
      case 'budgets': return <BudgetsAndRules />;
      case 'bot': return <BotSimulator />;
      case 'settings': return <SettingsPanel />;
      default: return <Dashboard />;
    }
  };

  return (
    <div className={cn('flex min-h-screen', darkMode ? 'bg-[#080b11] text-slate-100' : 'bg-slate-100 text-slate-900')}>
      {/* Desktop Sidebar */}
      <Sidebar activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Main content */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top header (mobile + desktop) */}
        <header className={cn(
          'sticky top-0 z-20 px-4 py-3 border-b backdrop-blur-md flex items-center justify-between',
          darkMode ? 'bg-[#080b11]/90 border-slate-800' : 'bg-slate-100/90 border-slate-200'
        )}>
          <div className="flex items-center gap-3">
            {/* Mobile: hamburger */}
            <button className="lg:hidden p-1.5" onClick={() => setMobileMenuOpen(v => !v)}>
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </button>
            <div>
              <h1 className="font-bold text-base">{PAGE_TITLES[activeTab]}</h1>
              <p className={cn('text-[11px] hidden sm:block', darkMode ? 'text-slate-500' : 'text-slate-400')}>
                {activeTab === 'dashboard' && `${transactions.length} transaksi tersimpan`}
                {activeTab === 'transactions' && `${transactions.length} total entri`}
                {activeTab === 'bot' && `${messages.length} pesan dalam sesi ini`}
                {activeTab === 'budgets' && 'Kelola anggaran & aturan merchant'}
                {activeTab === 'settings' && 'Konfigurasi aplikasi & keamanan'}
              </p>
            </div>
          </div>

          {/* Status badge */}
          <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono', darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700')}>
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Live</span>
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileMenuOpen(false)}>
            <div className={cn('absolute left-0 top-0 h-full w-56 border-r shadow-xl', darkMode ? 'bg-[#0a0d14] border-slate-800' : 'bg-white border-slate-200')} onClick={e => e.stopPropagation()}>
              <div className="p-4">
                <div className="flex items-center gap-2.5 mb-6">
                  <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white font-black text-xs">FR</div>
                  <span className="font-bold">Finra</span>
                </div>
                <nav className="space-y-1">
                  {NAV_ITEMS.map(({ id, icon: Icon }) => (
                    <button key={id} onClick={() => { setActiveTab(id); setMobileMenuOpen(false); }}
                      className={cn('w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition',
                        activeTab === id ? 'bg-emerald-500/10 text-emerald-400' : darkMode ? 'text-slate-400 hover:text-white hover:bg-slate-800' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                      )}>
                      <Icon className="w-4 h-4" />
                      {PAGE_TITLES[id]}
                    </button>
                  ))}
                </nav>
              </div>
            </div>
          </div>
        )}

        {/* Page content */}
        <main className="flex-1 p-4 sm:p-6 overflow-auto">
          {renderContent()}
        </main>

        {/* Status bar */}
        <footer className={cn('border-t px-4 py-2 text-[11px] font-mono flex items-center justify-between', darkMode ? 'border-slate-800 text-slate-600' : 'border-slate-200 text-slate-400')}>
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1.5 text-emerald-500">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              PostgreSQL: CONNECTED
            </span>
            <span className="hidden sm:inline">Redis BullMQ: IDLE</span>
          </div>
          <span>FinBot AI v2.4 • TypeScript + Next.js</span>
        </footer>
      </div>
    </div>
  );
}
