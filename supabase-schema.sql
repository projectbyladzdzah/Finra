-- ============================================================================
-- FINRA DATABASE SCHEMA (Supabase PostgreSQL)
-- Jalankan query ini di Supabase: Dashboard -> SQL Editor -> New Query -> Run
-- ============================================================================

CREATE TABLE IF NOT EXISTS transactions (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL CHECK (type IN ('expense', 'income', 'transfer')),
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
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Index untuk mempercepat query pencarian dan urutan tanggal
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_category ON transactions(category);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(type);

-- Nonaktifkan Row Level Security (RLS) untuk kemudahan awal,
-- atau jika RLS aktif, izinkan anon & service_role akses penuh:
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access"
  ON transactions FOR SELECT
  USING (true);

CREATE POLICY "Allow public insert access"
  ON transactions FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Allow public update access"
  ON transactions FOR UPDATE
  USING (true);

CREATE POLICY "Allow public delete access"
  ON transactions FOR DELETE
  USING (true);
