-- ============================================
-- Bonded Database Setup
-- Run this in Supabase SQL Editor
-- ============================================

-- Step 1: Add missing fields to profiles table (if they don't exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS verification_expires_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS onboarding_complete boolean DEFAULT false;

-- Step 2: Create or replace auth trigger to auto-create profile
-- This runs when a new user signs up via Supabase Auth
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
DECLARE
  email_domain text;
  university_record record;
  is_edu_email boolean;
BEGIN
  -- Extract domain from email
  email_domain := lower(split_part(NEW.email, '@', 2));
  
  -- Check if email ends with .edu
  is_edu_email := email_domain LIKE '%.edu';
  
  -- Try to find matching university by domain
  SELECT * INTO university_record
  FROM public.universities
  WHERE domain = email_domain
  LIMIT 1;
  
  -- Insert into profiles table
  INSERT INTO public.profiles (
    id,
    email,
    university_id,
    is_verified,
    verification_expires_at,
    onboarding_complete,
    created_at,
    updated_at
  )
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(university_record.id, NULL), -- Set university_id if found, NULL otherwise
    is_edu_email, -- Auto-verify if .edu email
    CASE 
      WHEN is_edu_email THEN NULL -- No expiry for .edu emails
      ELSE NOW() + INTERVAL '7 days' -- 7 day countdown for non-.edu
    END,
    false, -- Onboarding not complete yet
    NOW(),
    NOW()
  )
  ON CONFLICT (id) DO NOTHING; -- Don't error if profile already exists
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Step 3: Create trigger (drop existing if it exists)
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 4: Set up Row Level Security (RLS) policies for profiles

-- Enable RLS
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Policy: Users can read their own profile
DROP POLICY IF EXISTS "Users can read own profile" ON public.profiles;
CREATE POLICY "Users can read own profile"
ON public.profiles
FOR SELECT
USING (auth.uid() = id);

-- Policy: Users can update their own profile
DROP POLICY IF EXISTS "Users can update own profile" ON public.profiles;
CREATE POLICY "Users can update own profile"
ON public.profiles
FOR UPDATE
USING (auth.uid() = id);

-- Policy: Users can insert their own profile (for trigger)
DROP POLICY IF EXISTS "Users can insert own profile" ON public.profiles;
CREATE POLICY "Users can insert own profile"
ON public.profiles
FOR INSERT
WITH CHECK (auth.uid() = id);

-- Policy: Users can read other profiles (for Yearbook - campus only)
-- This allows users to see other profiles from their university
DROP POLICY IF EXISTS "Users can read campus profiles" ON public.profiles;
CREATE POLICY "Users can read campus profiles"
ON public.profiles
FOR SELECT
USING (
  -- User can see profiles from their own university
  university_id IN (
    SELECT university_id 
    FROM public.profiles 
    WHERE id = auth.uid()
  )
  AND yearbook_visible = true -- Only if they're visible in yearbook
);

-- ============================================
-- Notes:
-- 1. Make sure you have at least one university in the universities table
-- 2. The trigger will auto-assign university_id if domain matches
-- 3. .edu emails are auto-verified
-- 4. Non-.edu emails get 7 day countdown
-- ============================================
