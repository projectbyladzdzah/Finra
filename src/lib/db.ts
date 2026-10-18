import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './data';

const connectionString =
  process.env.DATABASE_URL ||
  process.env.POSTGRES_URL ||
  process.env.POSTGRES_PRISMA_URL ||
  '';

export const isDbConfigured = Boolean(connectionString && connectionString.startsWith('postgres'));

let sqlClient: NeonQueryFunction<false, false> | null = null;
if (isDbConfigured) {
  try {
    sqlClient = neon(connectionString);
  } catch (err) {
    console.warn('[Neon DB] Initialization error:', err);
  }
}

// Global cache fallback
declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_TRANSACTIONS__: Transaction[] | undefined;
}

if (!global.__GLOBAL_TRANSACTIONS__) {
  global.__GLOBAL_TRANSACTIONS__ = [...INITIAL_TRANSACTIONS];
}

// Auto-create transactions table if not exists
let tableChecked = false;
async function ensureTableExists(sql: NeonQueryFunction<false, false>) {
  if (tableChecked) return;
  try {
    await sql`
      CREATE TABLE IF NOT EXISTS transactions (
        id TEXT PRIMARY KEY,
        type TEXT NOT NULL,
        amount NUMERIC NOT NULL,
        currency TEXT NOT NULL DEFAULT 'IDR',
        date TEXT NOT NULL,
        merchant TEXT,
        description TEXT NOT NULL,
        category TEXT NOT NULL,
        subcategory TEXT,
        payment_method TEXT,
        source TEXT DEFAULT 'text',
        confidence NUMERIC DEFAULT 1.0,
        raw_input TEXT,
        attachment_url TEXT,
        notes TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;
    tableChecked = true;
  } catch (err: any) {
    console.warn('[Neon DB] Table check/creation warning:', err?.message);
  }
}

export async function getTransactions(): Promise<Transaction[]> {
  if (isDbConfigured && sqlClient) {
    try {
      await ensureTableExists(sqlClient);
      const rows = await sqlClient`
        SELECT 
          id, type, CAST(amount AS DOUBLE PRECISION) as amount, currency, 
          date, merchant, description, category, subcategory, 
          payment_method, source, CAST(confidence AS DOUBLE PRECISION) as confidence, 
          raw_input, attachment_url, notes
        FROM transactions
        ORDER BY date DESC
      `;

      if (rows && rows.length > 0) {
        return rows as unknown as Transaction[];
      }
      // If table is newly created / empty, return seed data
      return global.__GLOBAL_TRANSACTIONS__ || [];
    } catch (err: any) {
      console.warn('[Neon DB] Fetch error, using local fallback:', err?.message);
    }
  }

  return global.__GLOBAL_TRANSACTIONS__ || [];
}

export async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  // Always keep in-memory fallback updated
  if (!global.__GLOBAL_TRANSACTIONS__) {
    global.__GLOBAL_TRANSACTIONS__ = [];
  }
  global.__GLOBAL_TRANSACTIONS__.unshift(newTx);

  if (isDbConfigured && sqlClient) {
    try {
      await ensureTableExists(sqlClient);
      await sqlClient`
        INSERT INTO transactions (
          id, type, amount, currency, date, merchant, description, 
          category, subcategory, payment_method, source, confidence, 
          raw_input, attachment_url, notes
        ) VALUES (
          ${newTx.id}, ${newTx.type}, ${newTx.amount}, ${newTx.currency}, 
          ${newTx.date}, ${newTx.merchant || null}, ${newTx.description}, 
          ${newTx.category}, ${newTx.subcategory || null}, ${newTx.payment_method || null}, 
          ${newTx.source || 'text'}, ${newTx.confidence || 1.0}, 
          ${newTx.raw_input || null}, ${newTx.attachment_url || null}, ${newTx.notes || null}
        )
      `;
    } catch (err: any) {
      console.error('[Neon DB] Insert error:', err?.message);
    }
  }

  return newTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (isDbConfigured && sqlClient) {
    try {
      await ensureTableExists(sqlClient);
      await sqlClient`DELETE FROM transactions WHERE id = ${id}`;
    } catch (err: any) {
      console.error('[Neon DB] Delete error:', err?.message);
    }
  }

  if (!global.__GLOBAL_TRANSACTIONS__) return false;
  const initialLen = global.__GLOBAL_TRANSACTIONS__.length;
  global.__GLOBAL_TRANSACTIONS__ = global.__GLOBAL_TRANSACTIONS__.filter(t => t.id !== id);
  return global.__GLOBAL_TRANSACTIONS__.length < initialLen;
}
