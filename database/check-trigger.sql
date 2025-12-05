-- Check for trigger on auth.users table
-- The trigger is on auth schema, not public schema

SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  event_object_schema
FROM information_schema.triggers
WHERE trigger_name = 'on_auth_user_created';

-- Alternative: Check all triggers on auth schema
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table
FROM information_schema.triggers
WHERE event_object_schema = 'auth';

