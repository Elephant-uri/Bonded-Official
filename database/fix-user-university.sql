-- ============================================================================
-- FIX USER UNIVERSITY_ID FOR EVENT CREATION
-- ============================================================================
-- Run this in your Supabase SQL Editor
-- ============================================================================

-- STEP 1: Check your current profile
SELECT
  id,
  email,
  university_id,
  first_name,
  last_name
FROM profiles
WHERE email = 'isaac@mergefund.org';

-- STEP 2: Check available universities
SELECT
  id,
  name,
  short_name,
  created_at
FROM universities
ORDER BY name;

-- ============================================================================
-- STEP 3: Update your profile with a university_id
-- ============================================================================
-- IMPORTANT: Replace 'YOUR-UNIVERSITY-ID-HERE' with an actual university ID from the query above
-- If there are no universities, we'll create one first (see STEP 4)
-- ============================================================================

-- Uncomment and run this after you have a university ID:
-- UPDATE profiles
-- SET university_id = 'YOUR-UNIVERSITY-ID-HERE'
-- WHERE email = 'isaac@mergefund.org';

-- ============================================================================
-- STEP 4: If no universities exist, create one first
-- ============================================================================
-- Uncomment and modify this to create a university:
/*
INSERT INTO universities (name, short_name, domain, location, is_active)
VALUES
  ('University of Rhode Island', 'URI', 'uri.edu', 'Kingston, RI', true)
RETURNING id, name;
*/

-- Then use the returned ID in STEP 3 above

-- ============================================================================
-- STEP 5: Verify the update worked
-- ============================================================================
SELECT
  p.id,
  p.email,
  p.university_id,
  u.name as university_name,
  u.short_name
FROM profiles p
LEFT JOIN universities u ON p.university_id = u.id
WHERE p.email = 'isaac@mergefund.org';

-- ============================================================================
-- ALTERNATIVE: Make university_id optional for event creation (temporary fix)
-- ============================================================================
-- If you want to allow event creation without university_id, uncomment below:
/*
-- This removes the university_id requirement from useCreateEvent
-- Note: This is a temporary workaround. Better to have proper university data.

-- Allow profiles without university_id
ALTER TABLE profiles
ALTER COLUMN university_id DROP NOT NULL;

-- The hook will need to be updated too - see below
*/

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- The error happens because useCreateEvent.js line 21-29 tries to:
-- 1. Fetch university_id from your profile
-- 2. Throws error if university_id is null
-- 3. Includes university_id in event creation
--
-- Solutions:
-- A) Add university_id to your profile (recommended) - Run STEP 3 above
-- B) Create a default university first - Run STEP 4 then STEP 3
-- C) Modify the code to allow null university_id (see alternative below)
--
-- ============================================================================
