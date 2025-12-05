-- ============================================
-- Onboarding Schema Updates
-- Add these fields to your profiles table
-- ============================================

-- Add onboarding tracking fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS onboarding_step text,
ADD COLUMN IF NOT EXISTS profile_completion_percentage integer DEFAULT 0,
ADD COLUMN IF NOT EXISTS last_onboarding_update timestamp with time zone;

-- Add required basic info fields (if not exist)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS age integer,
ADD COLUMN IF NOT EXISTS grade text, -- 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'
ADD COLUMN IF NOT EXISTS gender text;

-- Add optional onboarding fields (JSON for flexibility)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS interests jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS personality_tags jsonb DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS humor_style text,
ADD COLUMN IF NOT EXISTS aesthetic text,
ADD COLUMN IF NOT EXISTS study_habits jsonb,
ADD COLUMN IF NOT EXISTS living_habits jsonb,
ADD COLUMN IF NOT EXISTS personality_answers jsonb DEFAULT '{}'::jsonb,
ADD COLUMN IF NOT EXISTS class_schedule jsonb;

-- Create index for completion percentage (for finding users to prompt)
CREATE INDEX IF NOT EXISTS idx_profiles_completion 
ON public.profiles(profile_completion_percentage) 
WHERE profile_completion_percentage < 100;

-- Create index for last onboarding update (for reminders)
CREATE INDEX IF NOT EXISTS idx_profiles_onboarding_update 
ON public.profiles(last_onboarding_update) 
WHERE profile_completion_percentage < 100;

-- ============================================
-- Notes:
-- 1. All optional fields are nullable
-- 2. JSONB fields allow flexible schema for future additions
-- 3. Indexes help with querying incomplete profiles for reminders
-- 4. Completion percentage: 0-100 (20% after basic info, 100% when all done)
-- ============================================

