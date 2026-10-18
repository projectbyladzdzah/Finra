import { Transaction, Category, MerchantRule, Budget } from './types';

// ============================================================================
// DEFAULT SEED DATA
// ============================================================================

export const DEFAULT_CATEGORIES: Category[] = [
  { id: 'cat-1', name: 'Makanan & Minuman', type: 'expense', icon: '🍽️', color: '#10b981' },
  { id: 'cat-2', name: 'Transportasi', type: 'expense', icon: '🚗', color: '#3b82f6' },
  { id: 'cat-3', name: 'Belanja', type: 'expense', icon: '🛍️', color: '#f59e0b' },
  { id: 'cat-4', name: 'Tagihan & Utilitas', type: 'expense', icon: '💡', color: '#8b5cf6' },
  { id: 'cat-5', name: 'Hiburan', type: 'expense', icon: '🎬', color: '#ec4899' },
  { id: 'cat-6', name: 'Kesehatan', type: 'expense', icon: '💊', color: '#14b8a6' },
  { id: 'cat-7', name: 'Pendidikan', type: 'expense', icon: '📚', color: '#6366f1' },
  { id: 'cat-8', name: 'Cicilan/Hutang', type: 'expense', icon: '💳', color: '#f43f5e' },
  { id: 'cat-9', name: 'Donasi/Sosial', type: 'expense', icon: '🤝', color: '#06b6d4' },
  { id: 'cat-10', name: 'Investasi', type: 'expense', icon: '📈', color: '#84cc16' },
  { id: 'cat-11', name: 'Gaji', type: 'income', icon: '💰', color: '#22c55e' },
  { id: 'cat-12', name: 'Bonus', type: 'income', icon: '🎁', color: '#eab308' },
  { id: 'cat-13', name: 'Lainnya', type: 'expense', icon: '📌', color: '#64748b' },
];

export const INITIAL_MERCHANT_RULES: MerchantRule[] = [
  { id: 'rule-1', pattern: 'gofood', merchantName: 'GoFood', category: 'Makanan & Minuman', defaultPayment: 'GoPay', hits: 42 },
  { id: 'rule-2', pattern: 'grabfood', merchantName: 'GrabFood', category: 'Makanan & Minuman', defaultPayment: 'OVO', hits: 19 },
  { id: 'rule-3', pattern: 'kopi kenangan', merchantName: 'Kopi Kenangan', category: 'Makanan & Minuman', defaultPayment: 'QRIS', hits: 27 },
  { id: 'rule-4', pattern: 'bensin', merchantName: 'Pertamina SPBU', category: 'Transportasi', defaultPayment: 'MyPertamina', hits: 15 },
  { id: 'rule-5', pattern: 'gojek', merchantName: 'Gojek', category: 'Transportasi', defaultPayment: 'GoPay', hits: 31 },
  { id: 'rule-6', pattern: 'indomaret', merchantName: 'Indomaret', category: 'Belanja', defaultPayment: 'QRIS', hits: 24 },
  { id: 'rule-7', pattern: 'alfamart', merchantName: 'Alfamart', category: 'Belanja', defaultPayment: 'Cash', hits: 11 },
  { id: 'rule-8', pattern: 'tokopedia', merchantName: 'Tokopedia', category: 'Belanja', defaultPayment: 'BCA Virtual Account', hits: 18 },
  { id: 'rule-9', pattern: 'pln', merchantName: 'PLN Listrik', category: 'Tagihan & Utilitas', defaultPayment: 'BCA', hits: 12 },
  { id: 'rule-10', pattern: 'netflix', merchantName: 'Netflix', category: 'Hiburan', defaultPayment: 'Kartu Debit', hits: 6 },
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  {
    id: 'tx-101', type: 'income', amount: 14500000, currency: 'IDR',
    date: '2026-10-01 09:00', merchant: 'PT Teknologi Nusantara',
    description: 'Gaji Bulanan Oktober', category: 'Gaji', subcategory: 'Payroll',
    payment_method: 'BCA', source: 'text', confidence: 0.99,
    raw_input: 'gaji masuk 14,5jt bca', attachment_url: null, notes: 'Auto-saved'
  },
  {
    id: 'tx-102', type: 'expense', amount: 550000, currency: 'IDR',
    date: '2026-10-05 14:20', merchant: 'PLN & Biznet',
    description: 'Token Listrik & Internet', category: 'Tagihan & Utilitas', subcategory: 'Utilitas',
    payment_method: 'BCA', source: 'image', confidence: 0.97,
    raw_input: '[Screenshot m-BCA]', attachment_url: 'sample-bca', notes: 'Ref: 9920184412'
  },
  {
    id: 'tx-103', type: 'expense', amount: 420000, currency: 'IDR',
    date: '2026-10-10 19:15', merchant: 'Super Indo',
    description: 'Belanja bulanan dapur', category: 'Belanja', subcategory: 'Groceries',
    payment_method: 'QRIS', source: 'text', confidence: 0.95,
    raw_input: 'belanja bulanan super indo 420rb qris', attachment_url: null, notes: null
  },
  {
    id: 'tx-104', type: 'expense', amount: 185000, currency: 'IDR',
    date: '2026-10-14 12:40', merchant: 'Resto Padang Sederhana',
    description: 'Makan siang tim', category: 'Makanan & Minuman', subcategory: null,
    payment_method: 'GoPay', source: 'text', confidence: 0.96,
    raw_input: 'makan siang padang sederhana 185rb gopay', attachment_url: null, notes: null
  },
  {
    id: 'tx-105', type: 'expense', amount: 150000, currency: 'IDR',
    date: '2026-10-16 08:15', merchant: 'Pertamina SPBU',
    description: 'Isi bensin Pertamax', category: 'Transportasi', subcategory: 'BBM',
    payment_method: 'QRIS', source: 'text', confidence: 0.98,
    raw_input: 'bensin pertamax 150rb qris', attachment_url: null, notes: null
  },
  {
    id: 'tx-106', type: 'transfer', amount: 750000, currency: 'IDR',
    date: '2026-10-17 16:05', merchant: 'Ibu Siti',
    description: 'Transfer uang bulanan ke Ibu', category: 'Donasi/Sosial', subcategory: 'Keluarga',
    payment_method: 'BCA', source: 'text', confidence: 0.96,
    raw_input: 'transfer ke ibu 750rb bca', attachment_url: null, notes: null
  },
  {
    id: 'tx-107', type: 'expense', amount: 1500000, currency: 'IDR',
    date: '2026-10-17 20:00', merchant: 'Bibit Reksadana',
    description: 'Auto-debit Reksadana', category: 'Investasi', subcategory: 'Reksadana',
    payment_method: 'GoPay', source: 'text', confidence: 0.99,
    raw_input: 'investasi bibit reksadana 1,5jt', attachment_url: null, notes: null
  },
];

export const INITIAL_BUDGETS: Budget[] = [
  { category: 'Makanan & Minuman', limit: 1500000 },
  { category: 'Transportasi', limit: 600000 },
  { category: 'Belanja', limit: 1200000 },
  { category: 'Tagihan & Utilitas', limit: 800000 },
  { category: 'Hiburan', limit: 500000 },
  { category: 'Donasi/Sosial', limit: 1000000 },
];

export const SAMPLE_RECEIPTS = {
  bca: {
    id: 'sample-bca', title: 'm-BCA Transfer', subtitle: 'Rp175.000 ke Kopi Roastery Nusantara', badge: 'Single OCR',
    mockText: '[Screenshot m-BCA: Transfer Rp 175.000,00 ke KOPI ROASTERY NUSANTARA]',
    transactions: [{
      type: 'expense' as const, amount: 175000, currency: 'IDR', date: '2026-10-18 09:45',
      merchant: 'Kopi Roastery Nusantara', description: 'Beli biji kopi arabika',
      category: 'Makanan & Minuman', subcategory: 'Kopi', payment_method: 'BCA',
      confidence: 0.98, notes: 'Ref: 01829481029'
    }]
  },
  gopay: {
    id: 'sample-gopay', title: 'Riwayat GoPay (3x)', subtitle: '3 Transaksi dalam 1 screenshot', badge: 'Multi-Tx',
    mockText: '[GoPay: GoFood Ayam Geprek Rp34.000, GoRide Rp18.500, Pulsa Rp51.500]',
    transactions: [
      {
        type: 'expense' as const, amount: 34000, currency: 'IDR', date: '2026-10-18 12:15',
        merchant: 'GoFood - Ayam Geprek', description: 'Makan siang Ayam Geprek',
        category: 'Makanan & Minuman', subcategory: 'Delivery', payment_method: 'GoPay',
        confidence: 0.96, notes: 'Batch #1'
      },
      {
        type: 'expense' as const, amount: 18500, currency: 'IDR', date: '2026-10-18 08:30',
        merchant: 'Gojek (GoRide)', description: 'GoRide ke Stasiun Sudirman',
        category: 'Transportasi', subcategory: 'Ojek Online', payment_method: 'GoPay',
        confidence: 0.97, notes: 'Batch #2'
      },
      {
        type: 'expense' as const, amount: 51500, currency: 'IDR', date: '2026-10-18 07:50',
        merchant: 'Tokopedia', description: 'Pulsa & Paket Data',
        category: 'Tagihan & Utilitas', subcategory: 'Pulsa', payment_method: 'GoPay',
        confidence: 0.94, notes: 'Batch #3'
      }
    ]
  },
  indomaret: {
    id: 'sample-indomaret', title: 'Struk Indomaret', subtitle: 'Rp64.500 (QRIS)', badge: 'Thermal',
    mockText: '[Struk Indomaret: Roti Tawar, Susu UHT, Sabun — Rp 64.500 QRIS]',
    transactions: [{
      type: 'expense' as const, amount: 64500, currency: 'IDR', date: '2026-10-18 10:00',
      merchant: 'Indomaret', description: 'Belanja kebutuhan harian',
      category: 'Belanja', subcategory: 'Minimarket', payment_method: 'QRIS',
      confidence: 0.95, notes: 'Struk #IDM-8821'
    }]
  }
};
