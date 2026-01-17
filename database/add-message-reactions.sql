-- ============================================================================
-- Add Message Reactions Table
-- ============================================================================
-- This script creates a table for message reactions (hearts, bonds, etc.)
-- Similar to Instagram's message reactions but with Bonded's creative twist
--
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- Create message_reactions table
CREATE TABLE IF NOT EXISTS public.message_reactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  message_id uuid NOT NULL REFERENCES public.messages(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  reaction_type text NOT NULL CHECK (reaction_type IN ('heart', 'bond', 'fire', 'thumbs_up', 'laugh')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT message_reactions_pkey PRIMARY KEY (id),
  CONSTRAINT message_reactions_unique UNIQUE (message_id, user_id, reaction_type)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_message_reactions_message_id ON public.message_reactions(message_id);
CREATE INDEX IF NOT EXISTS idx_message_reactions_user_id ON public.message_reactions(user_id);

-- Enable RLS
ALTER TABLE public.message_reactions ENABLE ROW LEVEL SECURITY;

-- RLS Policies
-- Users can view reactions on messages in their conversations
CREATE POLICY "Users can view message reactions"
ON public.message_reactions FOR SELECT
TO authenticated
USING (
  message_id IN (
    SELECT m.id
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE cp.user_id = auth.uid()
  )
);

-- Users can add reactions to messages in their conversations
CREATE POLICY "Users can add message reactions"
ON public.message_reactions FOR INSERT
TO authenticated
WITH CHECK (
  user_id = auth.uid()
  AND message_id IN (
    SELECT m.id
    FROM messages m
    JOIN conversation_participants cp ON cp.conversation_id = m.conversation_id
    WHERE cp.user_id = auth.uid()
  )
);

-- Users can remove their own reactions
CREATE POLICY "Users can remove their own reactions"
ON public.message_reactions FOR DELETE
TO authenticated
USING (user_id = auth.uid());

-- Function to get reaction counts per message
CREATE OR REPLACE FUNCTION get_message_reaction_counts(message_id_param uuid)
RETURNS TABLE (
  reaction_type text,
  count bigint,
  user_ids uuid[]
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    mr.reaction_type,
    COUNT(*)::bigint as count,
    ARRAY_AGG(mr.user_id) as user_ids
  FROM message_reactions mr
  WHERE mr.message_id = message_id_param
  GROUP BY mr.reaction_type;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Verify table creation
SELECT 
  'message_reactions table created successfully! ✅' AS status,
  COUNT(*) as total_reactions
FROM message_reactions;

