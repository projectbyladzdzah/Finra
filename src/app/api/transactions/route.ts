import { NextResponse } from 'next/server';
import { getTransactions, addTransaction, updateTransaction, deleteTransaction, clearAllTransactions } from '@/lib/server-store';
import { getCurrentUser } from '@/lib/auth';

// GET /api/transactions — Returns transactions scoped to the logged-in user
export async function GET() {
  try {
    const user = await getCurrentUser();
    const transactions = await getTransactions(user?.id);
    return NextResponse.json({
      success: true,
      data: transactions,
      total: transactions.length,
    });
  } catch (error: any) {
    console.error('[API Transactions GET Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// POST /api/transactions — Insert a new transaction
export async function POST(req: Request) {
  try {
    const user = await getCurrentUser();
    const body = await req.json();

    if (!body.amount || !body.description) {
      return NextResponse.json(
        { success: false, error: 'Amount and description are required' },
        { status: 400 }
      );
    }

    const newTx = await addTransaction({
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
      notes: body.notes || 'via Web',
      user_id: user?.id || null,
    });

    return NextResponse.json({ success: true, data: newTx }, { status: 201 });
  } catch (error: any) {
    console.error('[API Transactions POST Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// PUT /api/transactions — Update an existing transaction
export async function PUT(req: Request) {
  try {
    const body = await req.json();
    if (!body.id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required for updating' },
        { status: 400 }
      );
    }

    const success = await updateTransaction(body);
    return NextResponse.json({ success, message: 'Transaksi berhasil diperbarui' });
  } catch (error: any) {
    console.error('[API Transactions PUT Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}

// DELETE /api/transactions?id=... or ?all=true — Delete single or clear all
export async function DELETE(req: Request) {
  try {
    const url = new URL(req.url);
    const id = url.searchParams.get('id');
    const all = url.searchParams.get('all') === 'true';
    const user = await getCurrentUser();

    if (all) {
      const cleared = await clearAllTransactions(user?.id);
      return NextResponse.json({ success: cleared, message: 'Semua transaksi dibersihkan' });
    }

    if (!id) {
      return NextResponse.json(
        { success: false, error: 'Transaction ID is required' },
        { status: 400 }
      );
    }

    const deleted = await deleteTransaction(id);
    return NextResponse.json({ success: deleted, message: 'Transaksi berhasil dihapus' });
  } catch (error: any) {
    console.error('[API Transactions DELETE Error]:', error);
    return NextResponse.json(
      { success: false, error: error.message || 'Internal Server Error' },
      { status: 500 }
    );
  }
}
