// ============================================================================
// SHARED DATA TYPES
// ============================================================================

export type TransactionType = 'expense' | 'income' | 'transfer';
export type BotPlatform = 'TELEGRAM' | 'WHATSAPP';
export type WaProvider = 'META_CLOUD' | 'FONNTE' | 'WABLAS';

export interface Transaction {
  id: string;
  type: TransactionType;
  amount: number;
  currency: string;
  date: string;
  merchant: string | null;
  description: string;
  category: string;
  subcategory: string | null;
  payment_method: string | null;
  source: 'text' | 'image';
  confidence: number;
  raw_input: string | null;
  attachment_url: string | null;
  notes: string | null;
  user_id?: string | null;
}

export interface Category {
  id: string;
  name: string;
  type: 'expense' | 'income';
  icon: string;
  color: string;
}

export interface MerchantRule {
  id: string;
  pattern: string;
  merchantName: string;
  category: string;
  defaultPayment: string;
  hits: number;
}

export interface Budget {
  category: string;
  limit: number;
}

export interface ChatMessage {
  id: string;
  sender: 'user' | 'bot';
  timestamp: string;
  text: string;
  engineBadge?: string;
  imagePreview?: string;
  uploadedImageUrl?: string;
  learnedRuleNote?: string;
  budgetAlertText?: string;
  draft?: {
    id: string;
    status: 'PENDING' | 'SAVED' | 'CANCELLED';
    isDuplicate: boolean;
    items: Partial<Transaction>[];
    rawInput: string;
    source: 'text' | 'image';
    attachmentUrl: string | null;
  };
}

export interface PipelineLog {
  id: string;
  timestamp: string;
  engine: string;
  latencyMs: number;
  tokensUsed: number;
  rawInput: string;
  validSchema: boolean;
  payload: any;
}

export interface AppMetrics {
  income: number;
  expense: number;
  balance: number;
  savingsRatio: number;
  dailyBurnRate: number;
  categoryChartData: { name: string; value: number; color: string; icon: string }[];
  dailyTrendData: { date: string; Pemasukan: number; Pengeluaran: number }[];
  totalRuleHits: number;
}
