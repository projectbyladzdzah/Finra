import { NextResponse } from 'next/server';
import { getTransactions, addTransaction } from '@/lib/server-store';

export async function GET() {
  const transactions = getTransactions();
  return NextResponse.json({
    success: true,
    data: transactions,
    total: transactions.length,
  });
}

export async function POST(req: Request) {
  try {
    const body = await req.json();
    if (!body.amount || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Amount and description are required' },
        { status: 400 }
      );
    }

    const newTx = addTransaction({
      date: body.date || new Date().toISOString().replace('T', ' ').substring(0, 16),
      type: body.type || 'expense',
      category: body.category || 'Lainnya',
      subcategory: body.subcategory || null,
      amount: Number(body.amount),
      currency: 'IDR',
      merchant: body.merchant || null,
      description: body.description,
      payment_method: body.payment_method || 'WhatsApp',
      source: body.source || 'text',
      confidence: body.confidence ?? 1.0,
      raw_input: body.raw_input || body.description,
      attachment_url: body.attachment_url || null,
      notes: body.notes || 'via API',
    });

    return NextResponse.json({ success: true, data: newTx }, { status: 201 });
  } catch (error: any) {
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
