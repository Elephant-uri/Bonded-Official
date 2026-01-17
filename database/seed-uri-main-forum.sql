-- ============================================================================
-- SEED DEFAULT MAIN FORUM FOR URI (University of Rhode Island)
-- ============================================================================
-- Run this in Supabase SQL Editor to create the default "Main" forum for URI
-- ============================================================================

-- Step 1: Check if URI university exists
SELECT id, name, domain 
FROM universities 
WHERE domain = 'uri.edu' OR LOWER(name) LIKE '%rhode island%';

-- Step 2: Create URI university if it doesn't exist
INSERT INTO universities (name, domain, location)
VALUES ('University of Rhode Island', 'uri.edu', 'Kingston, RI')
ON CONFLICT (domain) DO NOTHING
RETURNING id, name, domain;

-- Step 3: Get URI university ID (use the ID from Step 1 or Step 2)
-- Replace 'YOUR-URI-UNIVERSITY-ID' below with the actual UUID from the query above

-- Step 4: Create default "Main" forum for URI (only if it doesn't exist)
-- IMPORTANT: Replace 'YOUR-URI-UNIVERSITY-ID' with the actual UUID from Step 1/2
INSERT INTO forums (name, type, description, university_id, is_public)
SELECT
  'Main' AS name,
  'campus' AS type,
  'Main campus forum for University of Rhode Island' AS description,
  u.id AS university_id,
  true AS is_public
FROM universities u
WHERE u.domain = 'uri.edu'
  AND NOT EXISTS (
    SELECT 1
    FROM forums f
    WHERE f.university_id = u.id
      AND f.type = 'campus'
      AND f.name = 'Main'
  )
RETURNING id, name, type, university_id, created_at;

-- Step 5: Verify the forum was created
SELECT 
  f.id,
  f.name,
  f.type,
  f.description,
  f.university_id,
  u.name AS university_name,
  f.created_at
FROM forums f
JOIN universities u ON f.university_id = u.id
WHERE u.domain = 'uri.edu'
ORDER BY f.created_at DESC;

-- ============================================================================
-- NOTES:
-- - This creates a "Main" forum (not "The Quad") as specified
-- - The forum type is 'campus' which makes it the default main forum
-- - Only creates if it doesn't already exist (idempotent)
-- - Forum is public by default
-- ============================================================================

