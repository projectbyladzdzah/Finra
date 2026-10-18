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
import AuthScreen from '@/components/AuthScreen';
import { LayoutDashboard, ListOrdered, PieChart, MessageSquare, Settings, Menu, X, RefreshCw, LogOut } from 'lucide-react';

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
  const {
    darkMode, transactions, messages,
    currentUser, authLoading, setCurrentUser, logout
  } = useApp();

  const [activeTab, setActiveTab] = useState('dashboard');
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // 1. Loading state while checking active session cookie
  if (authLoading) {
    return (
      <div className={cn(
        'min-h-screen flex items-center justify-center transition-colors',
        darkMode ? 'bg-[#080b11] text-slate-100' : 'bg-slate-50 text-slate-900'
      )}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-emerald-400 to-indigo-500 flex items-center justify-center text-white font-bold text-sm shadow-lg shadow-emerald-500/20 animate-pulse">
            FR
          </div>
          <div className="flex items-center gap-2 text-xs font-mono text-slate-500">
            <RefreshCw className="w-3.5 h-3.5 animate-spin text-emerald-400" />
            <span>Memverifikasi sesi...</span>
          </div>
        </div>
      </div>
    );
  }

  // 2. Unauthenticated state -> Show Passwordless Email OTP Login
  if (!currentUser) {
    return (
      <AuthScreen
        darkMode={darkMode}
        onSuccess={user => setCurrentUser(user)}
      />
    );
  }

  // 3. Authenticated state -> Render App
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

          {/* Status badge & User avatar */}
          <div className="flex items-center gap-2.5">
            <div className={cn('flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-[11px] font-mono', darkMode ? 'bg-emerald-500/10 text-emerald-400' : 'bg-emerald-50 text-emerald-700')}>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live</span>
            </div>

            <div className={cn('hidden sm:flex items-center gap-2 pl-2 border-l', darkMode ? 'border-slate-800' : 'border-slate-200')}>
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 text-emerald-400 font-bold text-xs flex items-center justify-center uppercase">
                {currentUser.name?.[0] || currentUser.email[0]}
              </div>
              <span className="text-xs font-medium max-w-[140px] truncate">
                {currentUser.email}
              </span>
            </div>
          </div>
        </header>

        {/* Mobile sidebar overlay */}
        {mobileMenuOpen && (
          <div className="lg:hidden fixed inset-0 z-30" onClick={() => setMobileMenuOpen(false)}>
            <div className={cn('absolute left-0 top-0 h-full w-60 border-r shadow-xl flex flex-col justify-between', darkMode ? 'bg-[#0a0d14] border-slate-800' : 'bg-white border-slate-200')} onClick={e => e.stopPropagation()}>
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

              {/* Mobile logout */}
              <div className="p-4 border-t border-slate-800/60">
                <div className="text-xs text-slate-400 truncate mb-2">
                  {currentUser.email}
                </div>
                <button
                  onClick={() => logout()}
                  className="w-full flex items-center justify-center gap-2 py-2 px-3 rounded-xl text-xs font-semibold bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 transition"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>Keluar Akun</span>
                </button>
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
              Neon Postgres: CONNECTED
            </span>
          </div>
          <span>Finra v2.4 • Next.js + Neon Postgres</span>
        </footer>
      </div>
    </div>
  );
}
