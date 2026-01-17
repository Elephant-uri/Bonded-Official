-- Add yearbook quote to profiles.
-- Run in Supabase SQL editor.

ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS yearbook_quote text;
