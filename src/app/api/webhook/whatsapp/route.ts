import { NextResponse } from 'next/server';
import { parseIndonesianAmount, formatRupiah, getNowFormatted } from '@/lib/utils';
import { addTransaction, getTransactions } from '@/lib/server-store';

// Helper to determine category based on keywords in description
function detectCategory(text: string): string {
  const t = text.toLowerCase();
  if (/makan|minum|kopi|coffee|resto|warung|cafe|sate|bakso|nasgor|lunch|dinner|sarapan|snack|jajan/i.test(t)) {
    return 'Makan & Minum';
  }
  if (/bensin|pertamax|pertalite|bbm|parkir|tol|gojek|grab|maxim|ojol|taxi|kereta|krl|mrt|busway/i.test(t)) {
    return 'Transportasi';
  }
  if (/shopee|tokopedia|lazada|tiktok shop|supermarket|indomaret|alfamart|belanja|baju|sepatu/i.test(t)) {
    return 'Belanja';
  }
  if (/listrik|pln|pdam|air|wifi|indihome|biznet|pulsa|paket data|iuran|sewa|kos|kontrakan/i.test(t)) {
    return 'Tagihan & Utilitas';
  }
  if (/nonton|bioskop|netflix|spotify|game|steam|youtube|liburan|hotel/i.test(t)) {
    return 'Hiburan';
  }
  if (/gaji|salary|bonus|thr|dividen|penjualan|omset|cair/i.test(t)) {
    return 'Pemasukan';
  }
  return 'Lainnya';
}

// Helper to detect if income or expense
function detectType(text: string, category: string): 'income' | 'expense' {
  const t = text.toLowerCase();
  if (category === 'Pemasukan' || /gaji|salary|bonus|thr|dapat uang|terima uang|transfer masuk|omset|penjualan/i.test(t)) {
    return 'income';
  }
  return 'expense';
}

// Function to send WhatsApp reply back via Fonnte
async function sendFonnteReply(target: string, message: string) {
  const token = process.env.FONNTE_TOKEN;
  if (!token) {
    console.warn('[WhatsApp Webhook] FONNTE_TOKEN not set in environment variables.');
    return;
  }

  try {
    const formData = new URLSearchParams();
    formData.append('target', target);
    formData.append('message', message);
    formData.append('countryCode', '62');

    await fetch('https://api.fonnte.com/send_message', {
      method: 'POST',
      headers: {
        Authorization: token,
      },
      body: formData,
    });
  } catch (err) {
    console.error('[WhatsApp Webhook] Failed to send reply via Fonnte:', err);
  }
}

// GET: Healthcheck & Webhook Verification
export async function GET() {
  return NextResponse.json({
    status: 'active',
    service: 'Finra WhatsApp Webhook',
    timestamp: new Date().toISOString(),
  });
}

// POST: Webhook handler for Fonnte / WhatsApp Gateway
export async function POST(req: Request) {
  try {
    let sender = '';
    let message = '';
    let name = '';

    const contentType = req.headers.get('content-type') || '';

    // Handle application/json or application/x-www-form-urlencoded
    if (contentType.includes('application/json')) {
      const data = await req.json();
      sender = data.sender || data.from || '';
      message = data.message || data.text || '';
      name = data.name || data.pushName || 'Pengguna';
    } else {
      const formData = await req.formData();
      sender = (formData.get('sender') as string) || '';
      message = (formData.get('message') as string) || '';
      name = (formData.get('name') as string) || 'Pengguna';
    }

    if (!message || !sender) {
      return NextResponse.json({ success: false, error: 'Missing sender or message' }, { status: 400 });
    }

    const cleanMsg = message.trim();
    const lower = cleanMsg.toLowerCase();

    // 1. HELP / BANTUAN COMMAND
    if (['help', 'bantuan', 'menu', 'halo', 'hi', 'start'].includes(lower)) {
      const helpText = `👋 *Halo, ${name}!*\nSaya adalah asisten keuangan otomatis Finra.\n\n` +
        `📝 *Cara Catat Transaksi:*\n` +
        `Ketik langsung pengeluaran/pemasukan Anda:\n` +
        `• _"Makan siang sate ayam 35rb"_\n` +
        `• _"Beli bensin pertamax 50k"_\n` +
        `• _"Gaji freelance web 2.5jt"_\n` +
        `• _"Tagihan wifi indihome 375.000"_\n\n` +
        `📊 *Menu Lainnya:*\n` +
        `• Ketik *rekap* untuk melihat ringkasan keuangan saat ini.`;

      await sendFonnteReply(sender, helpText);
      return NextResponse.json({ success: true, action: 'help_sent' });
    }

    // 2. REKAP / LAPORAN COMMAND
    if (['rekap', 'laporan', 'saldo', 'ringkasan'].includes(lower)) {
      const txs = getTransactions();
      const totalIncome = txs.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
      const totalExpense = txs.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
      const net = totalIncome - totalExpense;

      const reportText = `📊 *REKAP KEUANGAN ANDA*\n` +
        `📅 Tanggal: ${getNowFormatted()}\n\n` +
        `🟢 Pemasukan: ${formatRupiah(totalIncome)}\n` +
        `🔴 Pengeluaran: ${formatRupiah(totalExpense)}\n` +
        `━━━━━━━━━━━━━━━━\n` +
        `💰 *Sisa Saldo Net: ${formatRupiah(net)}*\n\n` +
        `Total transaksi tersimpan: ${txs.length} transaksi.`;

      await sendFonnteReply(sender, reportText);
      return NextResponse.json({ success: true, action: 'rekap_sent' });
    }

    // 3. PARSE TRANSACTION
    const parsedAmount = parseIndonesianAmount(cleanMsg);

    if (parsedAmount && parsedAmount > 0) {
      const category = detectCategory(cleanMsg);
      const type = detectType(cleanMsg, category);
      
      // Clean description by removing amount tokens
      let desc = cleanMsg
        .replace(/(?:rp\.?\s*)?-?\d+(?:[.,]\d+)?\s*(rb|ribu|k|jt|juta)?\b/gi, '')
        .trim();
      if (!desc) desc = cleanMsg;

      // Add to store
      const newTx = addTransaction({
        date: getNowFormatted(),
        type,
        category,
        subcategory: null,
        amount: parsedAmount,
        currency: 'IDR',
        merchant: null,
        description: desc,
        payment_method: 'WhatsApp Bot',
        source: 'text',
        confidence: 0.95,
        raw_input: cleanMsg,
        attachment_url: null,
        notes: `Recorded via WA (${sender})`,
      });

      const icon = type === 'income' ? '🟢 *Pemasukan Dicatat!*' : '🔴 *Pengeluaran Dicatat!*';
      const confirmReply = `${icon}\n\n` +
        `📌 *Keterangan:* ${desc}\n` +
        `💰 *Nominal:* ${formatRupiah(parsedAmount)}\n` +
        `🏷️ *Kategori:* ${category}\n` +
        `🕒 *Waktu:* ${newTx.date}\n\n` +
        `_Data otomatis tersinkronisasi ke Dashboard Finra._ ✨`;

      await sendFonnteReply(sender, confirmReply);

      return NextResponse.json({
        success: true,
        action: 'transaction_recorded',
        transaction: newTx,
      });
    }

    // 4. UNRECOGNIZED FORMAT
    const unknownReply = `⚠️ *Format Belum Dikenali*\n` +
      `Sertakan nominal uang untuk mencatat otomatis.\n\n` +
      `Contoh:\n` +
      `• _"Makan bakso 25rb"_\n` +
      `• _"Bensin motor 30k"_\n` +
      `• _"Beli kopi 18000"_\n\n` +
      `Ketik *bantuan* untuk info lengkap.`;

    await sendFonnteReply(sender, unknownReply);

    return NextResponse.json({
      success: true,
      action: 'unknown_format_sent',
    });

  } catch (error: any) {
    console.error('[WhatsApp Webhook] Error processing request:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal error' },
      { status: 500 }
    );
  }
}
