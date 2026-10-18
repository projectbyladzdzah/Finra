'use client';

import { createContext, useContext, useState, useMemo, useCallback, useEffect, ReactNode, useRef } from 'react';
import type {
  Transaction, Category, MerchantRule, Budget, ChatMessage, PipelineLog, AppMetrics
} from '@/lib/types';
import {
  DEFAULT_CATEGORIES, INITIAL_MERCHANT_RULES,
  INITIAL_TRANSACTIONS, INITIAL_BUDGETS
} from '@/lib/data';
import {
  parseIndonesianAmount, validateAiOutputSchema,
  formatRupiah, getNowFormatted, getTimeShort
} from '@/lib/utils';

// ============================================================================
// APP CONTEXT — central state management replacing monolithic useState hell
// ============================================================================

interface AppContextType {
  // State
  darkMode: boolean;
  transactions: Transaction[];
  categories: Category[];
  merchantRules: MerchantRule[];
  budgets: Budget[];
  messages: ChatMessage[];
  pipelineLogs: PipelineLog[];
  isBotProcessing: boolean;
  botPlatform: 'TELEGRAM' | 'WHATSAPP';
  isAccountLinked: boolean;
  otpCode: string;
  autoSaveEnabled: boolean;
  autoSaveThreshold: number;
  metrics: AppMetrics;
  editingTxModal: Transaction | null;

  // Actions
  setDarkMode: (v: boolean) => void;
  setTransactions: (fn: (prev: Transaction[]) => Transaction[]) => void;
  setCategories: (fn: (prev: Category[]) => Category[]) => void;
  setMerchantRules: (fn: (prev: MerchantRule[]) => MerchantRule[]) => void;
  setBudgets: (fn: (prev: Budget[]) => Budget[]) => void;
  setBotPlatform: (p: 'TELEGRAM' | 'WHATSAPP') => void;
  setIsAccountLinked: (v: boolean) => void;
  setOtpCode: (v: string) => void;
  setAutoSaveEnabled: (v: boolean) => void;
  setAutoSaveThreshold: (v: number) => void;
  setEditingTxModal: (tx: Transaction | null) => void;
  handleSendMessage: (text?: string) => Promise<void>;
  handleSampleReceipt: (key: 'bca' | 'gopay' | 'indomaret') => void;
  handleRealImageUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  handleDraftAction: (msgId: string, action: 'SAVE' | 'CANCEL' | 'EDIT') => void;
  exportToCSV: () => void;
  commitTransactionEdit: (tx: Transaction) => void;
  chatInput: string;
  setChatInput: (v: string) => void;
  fileInputRef: React.RefObject<HTMLInputElement | null>;
}

const AppContext = createContext<AppContextType | null>(null);

export function AppProvider({ children }: { children: ReactNode }) {
  const [darkMode, setDarkMode] = useState(true);
  const [botPlatform, setBotPlatform] = useState<'TELEGRAM' | 'WHATSAPP'>('TELEGRAM');
  const [isAccountLinked, setIsAccountLinked] = useState(true);
  const [autoSaveEnabled, setAutoSaveEnabled] = useState(false);
  const [autoSaveThreshold, setAutoSaveThreshold] = useState(0.92);
  const [otpCode, setOtpCode] = useState('884920');
  const [categories, setCategories] = useState<Category[]>(DEFAULT_CATEGORIES);
  const [merchantRules, setMerchantRules] = useState<MerchantRule[]>(INITIAL_MERCHANT_RULES);
  const [transactions, setTransactions] = useState<Transaction[]>(INITIAL_TRANSACTIONS);
  const [budgets, setBudgets] = useState<Budget[]>(INITIAL_BUDGETS);
  const [chatInput, setChatInput] = useState('');
  const [isBotProcessing, setIsBotProcessing] = useState(false);
  const [editingTxModal, setEditingTxModal] = useState<Transaction | null>(null);
  const [pipelineLogs, setPipelineLogs] = useState<PipelineLog[]>([{
    id: 'log-init', timestamp: '09:00:02', engine: 'RULE_ENGINE', latencyMs: 2, tokensUsed: 0,
    rawInput: 'gaji masuk 14,5jt bca', validSchema: true,
    payload: { transactions: [INITIAL_TRANSACTIONS[0]] }
  }]);
  const [messages, setMessages] = useState<ChatMessage[]>([{
    id: 'msg-welcome', sender: 'bot', timestamp: '10:00',
    engineBadge: 'SYSTEM READY',
    text: '⚡ *Finra*\n\nKirim transaksi via chat:\n• `"makan siang 25rb gofood"`\n• `"gaji masuk 8jt"`\n• Klik tombol struk di bawah untuk simulasi Vision OCR.',
    draft: undefined
  }]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Sync transactions with backend store & auto-poll updates from WhatsApp webhook
  useEffect(() => {
    let isMounted = true;
    const syncTransactions = async () => {
      try {
        const res = await fetch('/api/transactions');
        if (res.ok) {
          const json = await res.json();
          if (json.success && Array.isArray(json.data) && isMounted) {
            setTransactions(json.data);
          }
        }
      } catch {
        // silent fallback
      }
    };

    syncTransactions();
    const interval = setInterval(syncTransactions, 4000);
    return () => {
      isMounted = false;
      clearInterval(interval);
    };
  }, []);

  // ── DERIVED METRICS ────────────────────────────────────────────────────────
  const metrics = useMemo<AppMetrics>(() => {
    const income = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
    const expense = transactions.filter(t => t.type !== 'income').reduce((a, b) => a + b.amount, 0);
    const balance = income - expense;
    const savingsRatio = income > 0 ? Math.max(0, Math.round(((income - expense) / income) * 100)) : 0;
    const dailyBurnRate = Math.round(expense / 18);
    const byCategoryMap: Record<string, number> = {};
    transactions.filter(t => t.type !== 'income').forEach(t => {
      byCategoryMap[t.category] = (byCategoryMap[t.category] || 0) + t.amount;
    });
    const categoryChartData = Object.entries(byCategoryMap).map(([name, value]) => {
      const found = categories.find(c => c.name === name);
      return { name, value, color: found?.color || '#64748b', icon: found?.icon || '📌' };
    }).sort((a, b) => b.value - a.value);
    const byDateMap: Record<string, { date: string; Pemasukan: number; Pengeluaran: number }> = {};
    transactions.forEach(t => {
      const dayKey = t.date.substring(5, 10);
      if (!byDateMap[dayKey]) byDateMap[dayKey] = { date: dayKey, Pemasukan: 0, Pengeluaran: 0 };
      if (t.type === 'income') byDateMap[dayKey].Pemasukan += t.amount;
      else byDateMap[dayKey].Pengeluaran += t.amount;
    });
    const dailyTrendData = Object.values(byDateMap).sort((a, b) => a.date.localeCompare(b.date));
    const totalRuleHits = merchantRules.reduce((acc, r) => acc + (r.hits || 0), 0);
    return { income, expense, balance, savingsRatio, dailyBurnRate, categoryChartData, dailyTrendData, totalRuleHits };
  }, [transactions, categories, merchantRules]);

  // ── HELPER: detect payment method ─────────────────────────────────────────
  const detectPaymentMethod = useCallback((text: string): string | null => {
    const lower = text.toLowerCase();
    if (lower.includes('gopay') || lower.includes('gofood')) return 'GoPay';
    if (lower.includes('ovo') || lower.includes('grab')) return 'OVO';
    if (lower.includes('bca')) return 'BCA';
    if (lower.includes('qris')) return 'QRIS';
    if (lower.includes('dana')) return 'DANA';
    if (lower.includes('cash') || lower.includes('tunai')) return 'Cash';
    return null;
  }, []);

  // ── HELPER: commit transactions + budget alerts ────────────────────────────
  const commitTransactions = useCallback((
    items: Partial<Transaction>[], rawInput: string, source: 'text' | 'image', attachmentUrl: string | null
  ) => {
    const newRecords = items.map((item, i) => ({
      ...item, id: `tx-${Date.now()}-${i}`, source, raw_input: rawInput, attachment_url: attachmentUrl
    })) as Transaction[];
    setTransactions(prev => [...newRecords, ...prev]);

    const alerts: string[] = [];
    newRecords.forEach(tx => {
      if (tx.type === 'expense') {
        const b = budgets.find(bg => bg.category === tx.category);
        if (b) {
          const currentSpent = transactions.filter(t => t.type === 'expense' && t.category === tx.category)
            .reduce((acc, cur) => acc + cur.amount, 0) + tx.amount;
          const pct = Math.round((currentSpent / b.limit) * 100);
          if (pct >= 100) alerts.push(`🚨 Budget ${tx.category} melewati limit! (${pct}%)`);
          else if (pct >= 80) alerts.push(`⚠️ Budget ${tx.category} sudah terpakai ${pct}%`);
        }
      }
    });
    return alerts;
  }, [budgets, transactions]);

  // ── CORE: analyze natural language text ───────────────────────────────────
  const analyzeNaturalText = useCallback(async (rawText: string) => {
    const startTime = performance.now();
    const nowStr = getNowFormatted();
    const segments = rawText.split(/[\n,;]+/).map(s => s.trim())
      .filter(s => s.length > 0 && parseIndonesianAmount(s) !== null);
    const targetSegments = segments.length > 0 ? segments : [rawText];
    const extractedList: Partial<Transaction>[] = [];
    let usedEngine = 'RULE_ENGINE';
    let tokensUsed = 0;

    for (const seg of targetSegments) {
      const amount = parseIndonesianAmount(seg);
      const lower = seg.toLowerCase();
      const matchedRule = merchantRules.find(r => lower.includes(r.pattern.toLowerCase()));

      if (amount && matchedRule) {
        setMerchantRules(prev => prev.map(r => r.id === matchedRule.id ? { ...r, hits: (r.hits || 0) + 1 } : r));
        extractedList.push({
          type: 'expense', amount, currency: 'IDR', date: nowStr,
          merchant: matchedRule.merchantName,
          description: seg.charAt(0).toUpperCase() + seg.slice(1),
          category: matchedRule.category, subcategory: null,
          payment_method: detectPaymentMethod(seg) || matchedRule.defaultPayment,
          confidence: 0.98, notes: `Rule: "${matchedRule.pattern}"`
        });
        continue;
      }

      if (amount) {
        let type: 'expense' | 'income' | 'transfer' = 'expense';
        let category = 'Lainnya';
        let merchant: string | null = null;

        if (/(gaji|salary|payroll|thr)/.test(lower)) { type = 'income'; category = 'Gaji'; merchant = 'Payroll'; }
        else if (/(bonus|komisi|cashback|freelance)/.test(lower)) { type = 'income'; category = 'Bonus'; }
        else if (/(transfer|tf|kirim)\s+(ke\s+)?/.test(lower)) { type = 'transfer'; category = 'Donasi/Sosial'; }
        else if (/(makan|kopi|ayam|bakso|nasi|warteg|jajan|boba|sate|padang|lunch|dinner)/.test(lower)) category = 'Makanan & Minuman';
        else if (/(bensin|parkir|tol|grab|gojek|kereta|krl|mrt|transjakarta)/.test(lower)) category = 'Transportasi';
        else if (/(listrik|pln|wifi|indihome|biznet|pulsa|internet|bpjs)/.test(lower)) category = 'Tagihan & Utilitas';
        else if (/(beli|belanja|shopee|tokopedia|lazada|baju|sepatu|minimarket)/.test(lower)) category = 'Belanja';
        else if (/(obat|dokter|apotek|vitamin|klinik)/.test(lower)) category = 'Kesehatan';
        else if (/(bioskop|netflix|spotify|game|steam)/.test(lower)) category = 'Hiburan';
        else if (/(cicilan|kredit|hutang|paylater)/.test(lower)) category = 'Cicilan/Hutang';
        else if (/(sedekah|infaq|zakat|donasi)/.test(lower)) category = 'Donasi/Sosial';
        else if (/(saham|reksadana|bibit|emas|crypto)/.test(lower)) category = 'Investasi';

        if (category === 'Lainnya') { usedEngine = 'AI_LLM_FALLBACK'; tokensUsed += 245; }

        extractedList.push({
          type, amount, currency: 'IDR', date: nowStr, merchant,
          description: seg.charAt(0).toUpperCase() + seg.slice(1),
          category, subcategory: null,
          payment_method: detectPaymentMethod(seg) || 'QRIS',
          confidence: category === 'Lainnya' ? 0.84 : 0.96, notes: null
        });
      }
    }

    if (extractedList.length === 0) throw new Error('Nominal tidak terdeteksi. Contoh: "makan siang 25rb gofood"');

    const payload = { transactions: extractedList };
    const validation = validateAiOutputSchema(payload);
    const latencyMs = Math.max(2, Math.round(performance.now() - startTime));
    setPipelineLogs(prev => [{
      id: `log-${Date.now()}`, timestamp: getTimeShort(), engine: usedEngine,
      latencyMs, tokensUsed, rawInput: rawText, validSchema: validation.valid, payload
    }, ...prev.slice(0, 24)]);
    if (!validation.valid) throw new Error(`Validasi gagal: ${validation.errors.join(', ')}`);
    return { payload, usedEngine, latencyMs, tokensUsed };
  }, [merchantRules, detectPaymentMethod]);

  // ── BOT: send message handler ──────────────────────────────────────────────
  const handleSendMessage = useCallback(async (customText?: string) => {
    const text = (customText ?? chatInput).trim();
    if (!text) return;
    if (!customText) setChatInput('');

    const userMsg: ChatMessage = { id: `u-${Date.now()}`, sender: 'user', timestamp: getTimeShort(), text };
    setMessages(prev => [...prev, userMsg]);

    // Slash commands
    if (text.startsWith('/')) {
      const parts = text.trim().split(/\s+/);
      const cmd = parts[0].toLowerCase();
      const arg = parts[1];

      if (cmd === '/link') {
        if (arg === otpCode) {
          setIsAccountLinked(true);
          setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), text: '✅ Akun berhasil terhubung!' }]);
        } else {
          setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), text: `❌ OTP salah. Gunakan: \`/link ${otpCode}\`` }]);
        }
        return;
      }
      if (['/saldo', '/hari_ini', '/minggu_ini', '/bulan_ini'].includes(cmd)) {
        const inc = transactions.filter(t => t.type === 'income').reduce((a, b) => a + b.amount, 0);
        const exp = transactions.filter(t => t.type !== 'income').reduce((a, b) => a + b.amount, 0);
        setMessages(prev => [...prev, {
          id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(),
          engineBadge: 'AGGREGATION',
          text: `📊 *Cashflow Summary*\n\n🟢 Pemasukan: *${formatRupiah(inc)}*\n🔴 Pengeluaran: *${formatRupiah(exp)}*\n💰 Net: *${formatRupiah(inc - exp)}*`
        }]);
        return;
      }
      if (cmd === '/undo') {
        if (transactions.length > 0) {
          const latest = transactions[0];
          setTransactions(prev => prev.slice(1));
          setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), text: `🗑️ Dihapus: *${latest.description}* (${formatRupiah(latest.amount)})` }]);
        }
        return;
      }
      if (cmd === '/export') { exportToCSV(); return; }
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), text: `Perintah \`${cmd}\` tidak dikenal. Gunakan /saldo, /undo, atau /export` }]);
      return;
    }

    if (!isAccountLinked) {
      setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), text: `🔒 Akun belum terhubung. Ketik \`/link ${otpCode}\`` }]);
      return;
    }

    setIsBotProcessing(true);
    setTimeout(async () => {
      try {
        const { payload, usedEngine, latencyMs, tokensUsed } = await analyzeNaturalText(text);
        const items = payload.transactions;
        const minConfidence = Math.min(...items.map((t: any) => t.confidence));
        const badge = `${usedEngine === 'RULE_ENGINE' ? '⚡ RULE' : '🧠 LLM'} • ${latencyMs}ms`;

        if (autoSaveEnabled && minConfidence >= autoSaveThreshold) {
          const alerts = commitTransactions(items, text, 'text', null);
          setMessages(prev => [...prev, {
            id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), engineBadge: badge,
            text: `✅ *Auto-Saved (${Math.round(minConfidence * 100)}%)*\n\n${formatTxSummary(items)}`,
            budgetAlertText: alerts.join('\n') || undefined
          }]);
        } else {
          const draftId = `draft-${Date.now()}`;
          setMessages(prev => [...prev, {
            id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), engineBadge: badge,
            text: `📝 *Konfirmasi Transaksi*\n\n${formatTxSummary(items)}`,
            draft: { id: draftId, status: 'PENDING', isDuplicate: false, items, rawInput: text, source: 'text', attachmentUrl: null }
          }]);
        }
      } catch (err: any) {
        setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), text: `❌ ${err.message}` }]);
      } finally { setIsBotProcessing(false); }
    }, 260);
  }, [chatInput, otpCode, isAccountLinked, analyzeNaturalText, autoSaveEnabled, autoSaveThreshold, commitTransactions, transactions]);

  const handleSampleReceipt = useCallback((key: 'bca' | 'gopay' | 'indomaret') => {
    const { SAMPLE_RECEIPTS } = require('@/lib/data');
    const sample = SAMPLE_RECEIPTS[key];
    if (!sample) return;
    setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', timestamp: getTimeShort(), text: `📸 [Simulasi Vision] *${sample.title}*`, imagePreview: sample.id }]);
    setIsBotProcessing(true);
    setTimeout(() => {
      const payload = { transactions: sample.transactions };
      validateAiOutputSchema(payload);
      setPipelineLogs(prev => [{ id: `log-${Date.now()}`, timestamp: getTimeShort(), engine: 'CLAUDE_VISION_OCR', latencyMs: 610, tokensUsed: 840, rawInput: sample.mockText, validSchema: true, payload }, ...prev.slice(0, 24)]);
      const draftId = `draft-${Date.now()}`;
      setMessages(prev => [...prev, {
        id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(),
        engineBadge: `👁️ VISION_OCR • ${sample.transactions.length}tx • 610ms`,
        text: `📸 *${sample.title}*\n\n${formatTxSummary(sample.transactions)}`,
        draft: { id: draftId, status: 'PENDING', isDuplicate: false, items: sample.transactions, rawInput: sample.mockText, source: 'image', attachmentUrl: sample.id }
      }]);
      setIsBotProcessing(false);
    }, 550);
  }, []);

  const handleRealImageUpload = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      const base64DataUrl = reader.result as string;
      setMessages(prev => [...prev, { id: `u-${Date.now()}`, sender: 'user', timestamp: getTimeShort(), text: `📸 Upload: *${file.name}*`, uploadedImageUrl: base64DataUrl }]);
      setIsBotProcessing(true);
      const nowStr = getNowFormatted();
      const fallbackItems = [{ type: 'expense' as const, amount: 95000, currency: 'IDR', date: nowStr, merchant: file.name.replace(/\.[^/.]+$/, ''), description: `Struk: ${file.name}`, category: 'Belanja', subcategory: null, payment_method: 'QRIS', confidence: 0.94, notes: null }];
      const draftId = `draft-${Date.now()}`;
      setTimeout(() => {
        setMessages(prev => [...prev, { id: `b-${Date.now()}`, sender: 'bot', timestamp: getTimeShort(), engineBadge: '👁️ VISION_UPLOAD', text: `📸 *Hasil: "${file.name}"*\n\n${formatTxSummary(fallbackItems)}`, draft: { id: draftId, status: 'PENDING', isDuplicate: false, items: fallbackItems, rawInput: `[Image: ${file.name}]`, source: 'image', attachmentUrl: base64DataUrl } }]);
        setIsBotProcessing(false);
        if (e.target) e.target.value = '';
      }, 400);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleDraftAction = useCallback((msgId: string, action: 'SAVE' | 'CANCEL' | 'EDIT') => {
    setMessages(prev => {
      const target = prev.find(m => m.id === msgId);
      if (!target?.draft) return prev;
      if (action === 'CANCEL') return prev.map(m => m.id === msgId ? { ...m, draft: { ...m.draft!, status: 'CANCELLED' } } : m);
      if (action === 'SAVE') {
        const alerts = commitTransactions(target.draft.items, target.draft.rawInput, target.draft.source, target.draft.attachmentUrl);
        return prev.map(m => m.id === msgId ? { ...m, draft: { ...m.draft!, status: 'SAVED' }, budgetAlertText: alerts.join('\n') || undefined } : m);
      }
      return prev;
    });
  }, [commitTransactions]);

  const exportToCSV = useCallback(() => {
    const headers = ['ID', 'Date', 'Type', 'Category', 'Merchant', 'Description', 'Payment', 'Amount', 'Confidence'];
    const rows = transactions.map(t => [t.id, t.date, t.type, `"${t.category}"`, `"${t.merchant || ''}"`, `"${t.description.replace(/"/g, '""')}"`, t.payment_method || '', t.amount, t.confidence]);
    const csv = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const link = document.createElement('a');
    link.setAttribute('href', encodeURI(csv));
    link.setAttribute('download', `finbot-ledger-${getNowFormatted().substring(0, 10)}.csv`);
    document.body.appendChild(link); link.click(); document.body.removeChild(link);
  }, [transactions]);

  const commitTransactionEdit = useCallback((tx: Transaction) => {
    setTransactions(prev => prev.map(item => item.id === tx.id ? tx : item));
    setEditingTxModal(null);
  }, []);

  return (
    <AppContext.Provider value={{
      darkMode, transactions, categories, merchantRules, budgets, messages, pipelineLogs,
      isBotProcessing, botPlatform, isAccountLinked, otpCode, autoSaveEnabled, autoSaveThreshold,
      metrics, editingTxModal,
      setDarkMode, setTransactions, setCategories, setMerchantRules, setBudgets,
      setBotPlatform, setIsAccountLinked, setOtpCode, setAutoSaveEnabled, setAutoSaveThreshold, setEditingTxModal,
      handleSendMessage, handleSampleReceipt, handleRealImageUpload, handleDraftAction,
      exportToCSV, commitTransactionEdit, chatInput, setChatInput, fileInputRef
    }}>
      {children}
    </AppContext.Provider>
  );
}

export function useApp(): AppContextType {
  const ctx = useContext(AppContext);
  if (!ctx) throw new Error('useApp must be used within AppProvider');
  return ctx;
}

// ── FORMAT HELPER ─────────────────────────────────────────────────────────────
function formatTxSummary(items: Partial<Transaction>[]): string {
  return items.map((tx, idx) => {
    const badge = tx.type === 'income' ? '🟢' : tx.type === 'transfer' ? '🔄' : '🔴';
    return `${items.length > 1 ? `*#${idx + 1}* ` : ''}${badge} *${formatRupiah(tx.amount || 0)}*\n• ${tx.description}\n• ${tx.category} | ${tx.payment_method || '-'} | Conf: ${Math.round((tx.confidence || 0) * 100)}%`;
  }).join('\n\n');
}
