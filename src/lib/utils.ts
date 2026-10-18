// ============================================================================
// CORE UTILITY: Indonesian Currency Parser & Formatter
// ============================================================================

export function parseIndonesianAmount(input: string): number | null {
  if (!input || typeof input !== 'string') return null;
  const text = input.toLowerCase().trim();

  const suffixRegex = /(?:rp\.?\s*)?(-?\d+(?:[.,]\d+)?)\s*(rb|ribu|k|jt|juta)\b/i;
  const suffixMatch = text.match(suffixRegex);
  if (suffixMatch) {
    const rawNum = suffixMatch[1].replace(',', '.');
    const val = parseFloat(rawNum);
    if (isNaN(val) || val <= 0) return null;
    const unit = suffixMatch[2].toLowerCase();
    const mult = unit === 'jt' || unit === 'juta' ? 1_000_000 : 1_000;
    return Math.round(val * mult);
  }

  const formattedRegex = /(?:rp\.?\s*)?(-?\d{1,3}(?:\.\d{3})+(?:,\d{1,2})?)\b/i;
  const formattedMatch = text.match(formattedRegex);
  if (formattedMatch) {
    const withoutDecimal = formattedMatch[1].split(',')[0];
    const cleanDigits = withoutDecimal.replace(/\./g, '');
    const parsed = parseInt(cleanDigits, 10);
    return parsed > 0 ? parsed : null;
  }

  const plainRegex = /(?:rp\.?\s*)?(-?\d{3,12})\b/i;
  const plainMatch = text.match(plainRegex);
  if (plainMatch) {
    const parsed = parseInt(plainMatch[1], 10);
    return parsed > 0 ? parsed : null;
  }

  return null;
}

export function formatRupiah(amount: number): string {
  if (typeof amount !== 'number' || isNaN(amount)) return 'Rp0';
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function validateAiOutputSchema(payload: any): { valid: boolean; errors: string[] } {
  const errors: string[] = [];
  if (!payload || typeof payload !== 'object') {
    return { valid: false, errors: ['Payload bukan object JSON yang valid'] };
  }
  if (!Array.isArray(payload.transactions) || payload.transactions.length === 0) {
    return { valid: false, errors: ['Field "transactions" wajib berupa array dan minimal berisi 1 item'] };
  }

  payload.transactions.forEach((tx: any, idx: number) => {
    if (!['expense', 'income', 'transfer'].includes(tx.type)) {
      errors.push(`transactions[${idx}].type wajib bernilai expense | income | transfer`);
    }
    if (typeof tx.amount !== 'number' || !Number.isInteger(tx.amount) || tx.amount <= 0) {
      errors.push(`transactions[${idx}].amount wajib integer positif > 0`);
    }
    if (tx.currency !== 'IDR') {
      errors.push(`transactions[${idx}].currency wajib "IDR"`);
    }
    const dateRegex = /^\d{4}-\d{2}-\d{2} \d{2}:\d{2}$/;
    if (typeof tx.date !== 'string' || !dateRegex.test(tx.date)) {
      errors.push(`transactions[${idx}].date wajib berformat YYYY-MM-DD HH:mm`);
    }
    if (!tx.description || typeof tx.description !== 'string' || !tx.description.trim()) {
      errors.push(`transactions[${idx}].description tidak boleh kosong`);
    }
    if (!tx.category || typeof tx.category !== 'string') {
      errors.push(`transactions[${idx}].category wajib diisi`);
    }
    if (typeof tx.confidence !== 'number' || tx.confidence < 0 || tx.confidence > 1) {
      errors.push(`transactions[${idx}].confidence wajib berada di rentang 0.0 - 1.0`);
    }
  });

  return { valid: errors.length === 0, errors };
}

export function getNowFormatted(): string {
  const now = new Date();
  const yyyy = now.getFullYear();
  const mm = String(now.getMonth() + 1).padStart(2, '0');
  const dd = String(now.getDate()).padStart(2, '0');
  const hh = String(now.getHours()).padStart(2, '0');
  const min = String(now.getMinutes()).padStart(2, '0');
  return `${yyyy}-${mm}-${dd} ${hh}:${min}`;
}

export function getTimeShort(): string {
  const now = new Date();
  return `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
}

export function cn(...classes: (string | undefined | null | false)[]): string {
  return classes.filter(Boolean).join(' ');
}
