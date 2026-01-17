-- ============================================================================
-- RESET conversation_participants RLS COMPLETELY
-- Run this FIRST, then run fix-all-rls-issues.sql
-- ============================================================================

-- Step 1: Disable RLS temporarily
ALTER TABLE conversation_participants DISABLE ROW LEVEL SECURITY;

-- Step 2: Drop ALL policies on this table (comprehensive list)
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'conversation_participants'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversation_participants', pol.policyname);
        RAISE NOTICE 'Dropped policy: %', pol.policyname;
    END LOOP;
END $$;

-- Step 3: Re-enable RLS
ALTER TABLE conversation_participants ENABLE ROW LEVEL SECURITY;

-- Step 4: Create simple, non-recursive policies
CREATE POLICY "cp_select"
ON conversation_participants FOR SELECT
TO authenticated
USING (user_id = auth.uid());

-- Users can add participants to conversations they created
CREATE POLICY "cp_insert"
ON conversation_participants FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  OR EXISTS (
    SELECT 1 FROM conversations
    WHERE id = conversation_id
    AND created_by = auth.uid()
  )
);

CREATE POLICY "cp_update"
ON conversation_participants FOR UPDATE
TO authenticated
USING (user_id = auth.uid())
WITH CHECK (user_id = auth.uid());

CREATE POLICY "cp_delete"
ON conversation_participants FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Step 5: Create helper function to get other participants (SECURITY DEFINER bypasses RLS)
DROP FUNCTION IF EXISTS get_conversation_participants(uuid);
CREATE OR REPLACE FUNCTION get_conversation_participants(conv_id uuid)
RETURNS TABLE (
  user_id uuid,
  full_name text,
  username text,
  avatar_url text
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();

  RETURN QUERY
  SELECT
    cp.user_id,
    COALESCE(p.full_name, p.username, 'User') as full_name,
    COALESCE(p.username, 'user') as username,
    p.avatar_url
  FROM conversation_participants cp
  LEFT JOIN profiles p ON p.id = cp.user_id
  WHERE cp.conversation_id = conv_id
  AND cp.user_id != current_user_id;
END;
$$;

-- ============================================================================
-- ALSO FIX conversations TABLE RLS
-- ============================================================================

-- Fix the type check constraint to accept 'direct' and 'group'
ALTER TABLE conversations DROP CONSTRAINT IF EXISTS conversations_type_check;
ALTER TABLE conversations ADD CONSTRAINT conversations_type_check
  CHECK (type IN ('direct', 'group'));

-- Drop existing policies on conversations
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'conversations'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON conversations', pol.policyname);
        RAISE NOTICE 'Dropped conversations policy: %', pol.policyname;
    END LOOP;
END $$;

-- Enable RLS on conversations if not already
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;

-- Users can view conversations they participate in
CREATE POLICY "conv_select"
ON conversations FOR SELECT
TO authenticated
USING (
  id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid()
  )
  OR created_by = auth.uid()
);

-- Users can create conversations
CREATE POLICY "conv_insert"
ON conversations FOR INSERT
TO authenticated
WITH CHECK (created_by = auth.uid());

-- Users can update conversations they created
CREATE POLICY "conv_update"
ON conversations FOR UPDATE
TO authenticated
USING (created_by = auth.uid())
WITH CHECK (created_by = auth.uid());

-- Users can delete conversations they created
CREATE POLICY "conv_delete"
ON conversations FOR DELETE
TO authenticated
USING (created_by = auth.uid());

-- ============================================================================
-- ALSO FIX messages TABLE RLS
-- ============================================================================

-- Drop existing policies on messages
DO $$
DECLARE
    pol RECORD;
BEGIN
    FOR pol IN
        SELECT policyname
        FROM pg_policies
        WHERE tablename = 'messages'
    LOOP
        EXECUTE format('DROP POLICY IF EXISTS %I ON messages', pol.policyname);
        RAISE NOTICE 'Dropped messages policy: %', pol.policyname;
    END LOOP;
END $$;

-- Enable RLS on messages if not already
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;

-- Users can view messages in their conversations
CREATE POLICY "msg_select"
ON messages FOR SELECT
TO authenticated
USING (
  conversation_id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Users can send messages to conversations they're in
CREATE POLICY "msg_insert"
ON messages FOR INSERT
TO authenticated
WITH CHECK (
  sender_id = auth.uid()
  AND conversation_id IN (
    SELECT conversation_id
    FROM conversation_participants
    WHERE user_id = auth.uid()
  )
);

-- Users can update their own messages
CREATE POLICY "msg_update"
ON messages FOR UPDATE
TO authenticated
USING (sender_id = auth.uid())
WITH CHECK (sender_id = auth.uid());

-- Users can delete their own messages
CREATE POLICY "msg_delete"
ON messages FOR DELETE
TO authenticated
USING (sender_id = auth.uid());

-- Verify all policies
SELECT tablename, policyname, cmd
FROM pg_policies
WHERE tablename IN ('conversation_participants', 'conversations', 'messages')
ORDER BY tablename, policyname;
