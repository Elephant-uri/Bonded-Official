-- Seed a default "Main" campus forum for every university that doesn't already have one.
-- Run in Supabase SQL editor.
-- Phase 1: Only default "Main" forum per university (no user-created forums)

INSERT INTO forums (name, type, description, university_id, is_public)
SELECT
  'Main' AS name,
  'campus' AS type,
  'Main campus forum' AS description,
  u.id AS university_id,
  true AS is_public
FROM universities u
WHERE NOT EXISTS (
  SELECT 1
  FROM forums f
  WHERE f.university_id = u.id
    AND f.type = 'campus'
    AND f.name = 'Main'
);
