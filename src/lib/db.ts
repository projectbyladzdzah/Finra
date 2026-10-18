import { neon, NeonQueryFunction } from '@neondatabase/serverless';
import { Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './data';

// Helper to get neon client dynamically using environment variables
export function getNeonSql(): NeonQueryFunction<false, false> | null {
  const connectionString =
    process.env.DATABASE_URL ||
    process.env.DATABASE_URL_UNPOOLED ||
    process.env.POSTGRES_URL ||
    '';

  if (!connectionString || (!connectionString.startsWith('postgres://') && !connectionString.startsWith('postgresql://'))) {
    return null;
  }

  try {
    return neon(connectionString);
  } catch (err) {
    console.warn('[Neon DB] Initialization error:', err);
    return null;
  }
}

// Global cache fallback
declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_TRANSACTIONS__: Transaction[] | undefined;
  // eslint-disable-next-line no-var
  var __GLOBAL_OTPS__: Map<string, { code: string; expiresAt: number }> | undefined;
  // eslint-disable-next-line no-var
  var __GLOBAL_USERS__: Map<string, { id: string; email: string; name?: string }> | undefined;
}

if (!global.__GLOBAL_TRANSACTIONS__) {
  global.__GLOBAL_TRANSACTIONS__ = [...INITIAL_TRANSACTIONS];
}
if (!global.__GLOBAL_OTPS__) {
  global.__GLOBAL_OTPS__ = new Map();
}
if (!global.__GLOBAL_USERS__) {
  global.__GLOBAL_USERS__ = new Map();
}

// Auto-create transactions & auth tables if not exists
let tableChecked = false;
async function ensureTableExists(sql: NeonQueryFunction<false, false>) {
  if (tableChecked) return;
  try {
    // 1. Transactions table
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

    // 2. Users table
    await sql`
      CREATE TABLE IF NOT EXISTS users (
        id TEXT PRIMARY KEY,
        email TEXT UNIQUE NOT NULL,
        name TEXT,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        last_login TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    // 3. Auth OTPs table
    await sql`
      CREATE TABLE IF NOT EXISTS auth_otps (
        email TEXT PRIMARY KEY,
        code TEXT NOT NULL,
        expires_at TIMESTAMP WITH TIME ZONE NOT NULL,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
      );
    `;

    tableChecked = true;
  } catch (err: any) {
    console.warn('[Neon DB] Table check/creation warning:', err?.message);
  }
}

// ============================================================================
// AUTH QUERIES
// ============================================================================

export async function saveOtp(email: string, code: string, expiresAt: Date): Promise<void> {
  const normEmail = email.toLowerCase().trim();
  global.__GLOBAL_OTPS__?.set(normEmail, { code, expiresAt: expiresAt.getTime() });

  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTableExists(sql);
      await sql`
        INSERT INTO auth_otps (email, code, expires_at)
        VALUES (${normEmail}, ${code}, ${expiresAt.toISOString()})
        ON CONFLICT (email)
        DO UPDATE SET code = ${code}, expires_at = ${expiresAt.toISOString()}, created_at = NOW()
      `;
    } catch (err: any) {
      console.error('[Neon DB] Save OTP error:', err?.message);
    }
  }
}

export async function verifyAndConsumeOtp(email: string, code: string): Promise<boolean> {
  const normEmail = email.toLowerCase().trim();
  const cleanCode = code.trim();
  const now = new Date();

  // Check in Neon DB first
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTableExists(sql);
      const rows = await sql`
        SELECT code, expires_at FROM auth_otps
        WHERE email = ${normEmail}
      `;

      if (rows && rows.length > 0) {
        const stored = rows[0];
        const expiry = new Date(stored.expires_at);
        if (stored.code === cleanCode && expiry > now) {
          // Valid! Consume from both DB and memory
          await sql`DELETE FROM auth_otps WHERE email = ${normEmail}`;
          global.__GLOBAL_OTPS__?.delete(normEmail);
          return true;
        }
        return false;
      }
      // If sql succeeded but no row found, it's either consumed or not found
      return false;
    } catch (err: any) {
      console.warn('[Neon DB] Verify OTP error, falling back to local cache:', err?.message);
    }
  }

  // Fallback to in-memory only if DB was not reachable
  const cached = global.__GLOBAL_OTPS__?.get(normEmail);
  if (cached && cached.code === cleanCode && cached.expiresAt > Date.now()) {
    global.__GLOBAL_OTPS__?.delete(normEmail);
    return true;
  }

  return false;
}

export async function getOrCreateUser(email: string): Promise<{ id: string; email: string; name?: string }> {
  const normEmail = email.toLowerCase().trim();
  const fallbackId = `user-${Date.now().toString(36)}`;

  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTableExists(sql);
      const existing = await sql`SELECT id, email, name FROM users WHERE email = ${normEmail}`;
      if (existing && existing.length > 0) {
        await sql`UPDATE users SET last_login = NOW() WHERE email = ${normEmail}`;
        return existing[0] as { id: string; email: string; name?: string };
      }

      // Create new user
      const newId = `usr_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
      const name = normEmail.split('@')[0];
      await sql`
        INSERT INTO users (id, email, name)
        VALUES (${newId}, ${normEmail}, ${name})
      `;
      return { id: newId, email: normEmail, name };
    } catch (err: any) {
      console.warn('[Neon DB] getOrCreateUser error, falling back to memory:', err?.message);
    }
  }

  let user = global.__GLOBAL_USERS__?.get(normEmail);
  if (!user) {
    user = { id: fallbackId, email: normEmail, name: normEmail.split('@')[0] };
    global.__GLOBAL_USERS__?.set(normEmail, user);
  }
  return user;
}

// ============================================================================
// TRANSACTIONS QUERIES
// ============================================================================

export async function getTransactions(): Promise<Transaction[]> {
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTableExists(sql);
      const rows = await sql`
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

  if (!global.__GLOBAL_TRANSACTIONS__) {
    global.__GLOBAL_TRANSACTIONS__ = [];
  }
  global.__GLOBAL_TRANSACTIONS__.unshift(newTx);

  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTableExists(sql);
      await sql`
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
  const sql = getNeonSql();
  if (sql) {
    try {
      await ensureTableExists(sql);
      await sql`DELETE FROM transactions WHERE id = ${id}`;
    } catch (err: any) {
      console.error('[Neon DB] Delete error:', err?.message);
    }
  }

  if (!global.__GLOBAL_TRANSACTIONS__) return false;
  const initialLen = global.__GLOBAL_TRANSACTIONS__.length;
  global.__GLOBAL_TRANSACTIONS__ = global.__GLOBAL_TRANSACTIONS__.filter(t => t.id !== id);
  return global.__GLOBAL_TRANSACTIONS__.length < initialLen;
}
