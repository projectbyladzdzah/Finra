import { Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './data';
import { supabase, isSupabaseConfigured } from './supabase';

// Global cache for fallback / dev mode
declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_TRANSACTIONS__: Transaction[] | undefined;
}

if (!global.__GLOBAL_TRANSACTIONS__) {
  global.__GLOBAL_TRANSACTIONS__ = [...INITIAL_TRANSACTIONS];
}

export async function getTransactions(): Promise<Transaction[]> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false });

      if (!error && data && data.length > 0) {
        return data as Transaction[];
      }
      if (!error && data && data.length === 0) {
        // If DB is fresh/empty, return seed data
        return global.__GLOBAL_TRANSACTIONS__ || [];
      }
      console.warn('[Supabase] Fetch error, falling back to local store:', error?.message);
    } catch (err: any) {
      console.warn('[Supabase] Query exception:', err?.message);
    }
  }

  return global.__GLOBAL_TRANSACTIONS__ || [];
}

export async function addTransaction(tx: Omit<Transaction, 'id'>): Promise<Transaction> {
  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  // Always update in-memory cache for fast local access
  if (!global.__GLOBAL_TRANSACTIONS__) {
    global.__GLOBAL_TRANSACTIONS__ = [];
  }
  global.__GLOBAL_TRANSACTIONS__.unshift(newTx);

  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('transactions')
        .insert([newTx]);

      if (error) {
        console.error('[Supabase] Insert error:', error.message);
      }
    } catch (err: any) {
      console.error('[Supabase] Insert exception:', err?.message);
    }
  }

  return newTx;
}

export async function deleteTransaction(id: string): Promise<boolean> {
  if (isSupabaseConfigured && supabase) {
    try {
      const { error } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (error) console.error('[Supabase] Delete error:', error.message);
    } catch (err: any) {
      console.error('[Supabase] Delete exception:', err?.message);
    }
  }

  if (!global.__GLOBAL_TRANSACTIONS__) return false;
  const initialLen = global.__GLOBAL_TRANSACTIONS__.length;
  global.__GLOBAL_TRANSACTIONS__ = global.__GLOBAL_TRANSACTIONS__.filter(t => t.id !== id);
  return global.__GLOBAL_TRANSACTIONS__.length < initialLen;
}
