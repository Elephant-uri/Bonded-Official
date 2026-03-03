-- Create waitlist table for landing page signups
-- Run this in Supabase SQL Editor if the table doesn't exist

CREATE TABLE IF NOT EXISTS public.waitlist (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  email text NOT NULL,
  school text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE(email)
);

-- Index for lookups
CREATE INDEX IF NOT EXISTS waitlist_email_idx ON public.waitlist (email);

-- Enable RLS
ALTER TABLE public.waitlist ENABLE ROW LEVEL SECURITY;

-- Allow anonymous inserts (for unauthenticated landing page signups)
CREATE POLICY "Allow anonymous insert" ON public.waitlist
  FOR INSERT
  TO anon
  WITH CHECK (true);

-- Allow service role full access (for admin/export)
CREATE POLICY "Service role full access" ON public.waitlist
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

-- Optional: Allow authenticated users to read (if you want to show count in app)
-- CREATE POLICY "Allow authenticated read" ON public.waitlist
--   FOR SELECT TO authenticated USING (true);
