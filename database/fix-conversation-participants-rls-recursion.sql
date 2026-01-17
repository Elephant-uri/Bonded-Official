-- Fix infinite recursion in conversation_participants RLS policy
-- Error: "infinite recursion detected in policy for relation \"conversation_participants\""
--
-- Run this in your Supabase SQL Editor

BEGIN;

-- Helper function to check membership without RLS recursion
CREATE OR REPLACE FUNCTION public.is_conversation_participant(conversation_uuid uuid, user_uuid uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.conversation_participants
    WHERE conversation_id = conversation_uuid
    AND user_id = user_uuid
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_conversation_participant(uuid, uuid) TO authenticated;

-- Drop the recursive policy
DROP POLICY IF EXISTS "Users can view all participations in their conversations" ON public.conversation_participants;

-- Recreate the non-recursive policy
CREATE POLICY "Users can view all participations in their conversations"
ON public.conversation_participants FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.conversations c
    WHERE c.id = conversation_participants.conversation_id
    AND public.is_conversation_participant(c.id, auth.uid())
  )
);

COMMIT;
