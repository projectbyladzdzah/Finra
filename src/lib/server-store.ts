import { Transaction } from './types';
import { INITIAL_TRANSACTIONS } from './data';

// Global cache for transactions (in-memory for serverless instance / dev server)
// In production with Vercel, can be backed by Supabase, Upstash Redis, or Vercel KV.
declare global {
  // eslint-disable-next-line no-var
  var __GLOBAL_TRANSACTIONS__: Transaction[] | undefined;
}

if (!global.__GLOBAL_TRANSACTIONS__) {
  global.__GLOBAL_TRANSACTIONS__ = [...INITIAL_TRANSACTIONS];
}

export function getTransactions(): Transaction[] {
  return global.__GLOBAL_TRANSACTIONS__ || [];
}

export function addTransaction(tx: Omit<Transaction, 'id'>): Transaction {
  const newTx: Transaction = {
    ...tx,
    id: `tx-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
  };

  if (!global.__GLOBAL_TRANSACTIONS__) {
    global.__GLOBAL_TRANSACTIONS__ = [];
  }
  global.__GLOBAL_TRANSACTIONS__.unshift(newTx);
  return newTx;
}

export function deleteTransaction(id: string): boolean {
  if (!global.__GLOBAL_TRANSACTIONS__) return false;
  const initialLen = global.__GLOBAL_TRANSACTIONS__.length;
  global.__GLOBAL_TRANSACTIONS__ = global.__GLOBAL_TRANSACTIONS__.filter(t => t.id !== id);
  return global.__GLOBAL_TRANSACTIONS__.length < initialLen;
}
