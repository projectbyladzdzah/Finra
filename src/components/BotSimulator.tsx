'use client';
import { useRef, useEffect } from 'react';
import { useApp } from '@/context/AppContext';
import { formatRupiah, cn } from '@/lib/utils';
import { Send, ImageIcon, RefreshCw, Check, X, Edit3, CheckCircle2, XCircle, Bot } from 'lucide-react';

const QUICK_PROMPTS = [
  { label: 'makan siang 25rb gofood', cmd: 'makan siang 25rb gofood' },
  { label: 'kopi kenangan 24rb', cmd: 'kopi kenangan 24rb' },
  { label: 'gaji masuk 8jt', cmd: 'gaji masuk 8jt' },
  { label: 'bensin 50k', cmd: 'bensin 50k' },
  { label: '/saldo', cmd: '/saldo' },
  { label: '/undo', cmd: '/undo' },
];

const VISION_SAMPLES = [
  { key: 'bca' as const, label: 'm-BCA' },
  { key: 'gopay' as const, label: 'GoPay (3x)' },
  { key: 'indomaret' as const, label: 'Struk Kasir' },
];

export default function BotSimulator() {
  const {
    darkMode, messages, isBotProcessing, botPlatform, setBotPlatform, isAccountLinked,
    autoSaveEnabled, setAutoSaveEnabled, chatInput, setChatInput,
    handleSendMessage, handleSampleReceipt, handleRealImageUpload, handleDraftAction, fileInputRef,
    categories
  } = useApp();

  const chatEndRef = useRef<HTMLDivElement>(null);
  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages, isBotProcessing]);

  const cardBg = cn('rounded-2xl border overflow-hidden flex flex-col h-[calc(100vh-10rem)]', darkMode ? 'bg-[#0d1117] border-slate-800' : 'bg-white border-slate-200 shadow-sm');

  return (
    <div className={cardBg}>
      {/* Header */}
      <div className={cn('px-4 py-3 border-b flex items-center justify-between shrink-0', darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}>
        <div className="flex items-center gap-3">
          <div className={cn('w-8 h-8 rounded-xl flex items-center justify-center text-white', botPlatform === 'TELEGRAM' ? 'bg-sky-500' : 'bg-emerald-500')}>
            <Bot className="w-4 h-4" />
          </div>
          <div>
            <div className="font-semibold text-sm">Webhook Simulator</div>
            <div className={cn('text-[10px] font-mono', isAccountLinked ? 'text-emerald-400' : 'text-rose-400')}>
              {isAccountLinked ? '● Terhubung' : '● Belum terhubung'}
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => setBotPlatform(botPlatform === 'TELEGRAM' ? 'WHATSAPP' : 'TELEGRAM')}
            className={cn('px-2.5 py-1 rounded-lg border text-[11px] font-mono font-semibold transition', darkMode ? 'bg-slate-900 border-slate-700 text-slate-300 hover:border-emerald-500/50' : 'bg-white border-slate-300 text-slate-700')}
          >
            {botPlatform === 'TELEGRAM' ? '⇄ WhatsApp' : '⇄ Telegram'}
          </button>
        </div>
      </div>

      {/* Quick prompts */}
      <div className={cn('px-3 py-2 border-b flex gap-1.5 overflow-x-auto shrink-0', darkMode ? 'bg-slate-950/70 border-slate-800' : 'bg-slate-50 border-slate-200')}>
        {QUICK_PROMPTS.map(p => (
          <button key={p.label} onClick={() => handleSendMessage(p.cmd)}
            className={cn('px-2.5 py-1 rounded-lg font-mono text-[11px] whitespace-nowrap border shrink-0 transition', darkMode ? 'bg-slate-900 border-slate-800 hover:border-emerald-500/50 text-slate-300' : 'bg-white border-slate-300 hover:border-emerald-500 text-slate-700')}>
            {p.label}
          </button>
        ))}
      </div>

      {/* Chat messages */}
      <div className={cn('flex-1 overflow-y-auto p-4 space-y-3', darkMode ? 'bg-[#080b11]' : 'bg-slate-50')}>
        {messages.map(msg => (
          <div key={msg.id} className={cn('flex flex-col', msg.sender === 'user' ? 'items-end' : 'items-start')}>
            <div className={cn('max-w-[88%] rounded-2xl px-3.5 py-2.5 text-xs shadow-sm',
              msg.sender === 'user'
                ? botPlatform === 'TELEGRAM' ? 'bg-sky-600 text-white rounded-br-sm' : 'bg-emerald-600 text-white rounded-br-sm'
                : darkMode ? 'bg-slate-900 border border-slate-800 text-slate-100 rounded-bl-sm' : 'bg-white border border-slate-200 text-slate-800 rounded-bl-sm'
            )}>
              {msg.engineBadge && (
                <div className={cn('mb-2 inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded-lg', darkMode ? 'bg-slate-950 text-emerald-400 border border-slate-800' : 'bg-emerald-50 text-emerald-700')}>
                  {msg.engineBadge}
                </div>
              )}
              {msg.uploadedImageUrl && <img src={msg.uploadedImageUrl} alt="upload" className="mb-2 max-h-32 rounded-xl object-cover" />}
              <div className="whitespace-pre-line leading-relaxed">
                {msg.text.split('*').map((chunk, i) =>
                  i % 2 === 1 ? <strong key={i}>{chunk}</strong> : <span key={i}>{chunk}</span>
                )}
              </div>
              {msg.learnedRuleNote && <div className={cn('mt-2 p-2 rounded-xl text-[11px] font-mono', darkMode ? 'bg-indigo-500/10 border border-indigo-500/20 text-indigo-300' : 'bg-indigo-50 text-indigo-700')}>{msg.learnedRuleNote}</div>}
              {msg.budgetAlertText && <div className={cn('mt-2 p-2 rounded-xl text-[11px]', darkMode ? 'bg-amber-500/10 border border-amber-500/20 text-amber-300' : 'bg-amber-50 text-amber-700')}>{msg.budgetAlertText}</div>}

              {msg.draft && (
                <div className="mt-2.5 pt-2 border-t border-white/10">
                  {msg.draft.status === 'PENDING' && (
                    <div className="flex gap-1.5">
                      <button onClick={() => handleDraftAction(msg.id, 'SAVE')} className="flex-1 py-1.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-[11px] flex items-center justify-center gap-1 transition">
                        <Check className="w-3 h-3" /> Simpan
                      </button>
                      <button onClick={() => handleDraftAction(msg.id, 'CANCEL')} className="py-1.5 px-3 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-400 border border-rose-500/30 font-semibold text-[11px] transition">
                        Batal
                      </button>
                    </div>
                  )}
                  {msg.draft.status === 'SAVED' && (
                    <div className="text-[11px] font-mono text-emerald-400 flex items-center gap-1">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Tersimpan
                    </div>
                  )}
                  {msg.draft.status === 'CANCELLED' && (
                    <div className="text-[11px] font-mono text-rose-400 flex items-center gap-1">
                      <XCircle className="w-3.5 h-3.5" /> Dibatalkan
                    </div>
                  )}
                </div>
              )}
              <div className="mt-1 text-[9px] font-mono opacity-40 text-right">{msg.timestamp}</div>
            </div>
          </div>
        ))}
        {isBotProcessing && (
          <div className={cn('flex items-center gap-2 text-[11px] font-mono px-2', 'text-emerald-400')}>
            <RefreshCw className="w-3.5 h-3.5 animate-spin" />
            <span>Memproses...</span>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      {/* Vision OCR preset buttons */}
      <div className={cn('px-3 py-2 border-t flex items-center gap-2 shrink-0', darkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200')}>
        <span className="text-[10px] font-mono font-bold text-amber-400 shrink-0">📸 OCR:</span>
        {VISION_SAMPLES.map(s => (
          <button key={s.key} onClick={() => handleSampleReceipt(s.key)}
            className={cn('text-[11px] font-mono px-2.5 py-1 rounded-lg border transition shrink-0', darkMode ? 'bg-slate-900 border-slate-800 hover:border-amber-400/50 text-slate-300' : 'bg-white border-slate-300 hover:border-amber-400 text-slate-700')}>
            {s.label}
          </button>
        ))}
        <label className="ml-auto flex items-center gap-1.5 text-[11px] font-mono cursor-pointer select-none">
          <input type="checkbox" checked={autoSaveEnabled} onChange={e => setAutoSaveEnabled(e.target.checked)} className="rounded accent-emerald-500" />
          <span className={darkMode ? 'text-slate-400' : 'text-slate-600'}>Auto-save</span>
        </label>
      </div>

      {/* Composer */}
      <form onSubmit={e => { e.preventDefault(); handleSendMessage(); }} className={cn('p-3 border-t flex items-center gap-2 shrink-0', darkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-200')}>
        <input ref={fileInputRef} type="file" accept="image/*" onChange={handleRealImageUpload} className="hidden" />
        <button type="button" onClick={() => fileInputRef.current?.click()} className={cn('p-2 rounded-xl border transition', darkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 text-slate-400' : 'bg-slate-100 border-slate-200 text-slate-500')}>
          <ImageIcon className="w-4 h-4" />
        </button>
        <input
          type="text" value={chatInput} onChange={e => setChatInput(e.target.value)}
          placeholder='Ketik "makan siang 25rb gofood" atau /saldo...'
          className={cn('flex-1 px-3.5 py-2 rounded-xl border text-xs outline-none focus:ring-1 focus:ring-emerald-500 transition', darkMode ? 'bg-slate-900 border-slate-800 text-white placeholder-slate-500' : 'bg-slate-50 border-slate-300 text-slate-900')}
        />
        <button type="submit" className="px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-semibold flex items-center gap-1.5 transition">
          <Send className="w-3.5 h-3.5" />
        </button>
      </form>
    </div>
  );
}
