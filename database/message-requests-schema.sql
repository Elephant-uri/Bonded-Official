-- ============================================================================
-- Message Requests Schema for Bonded
-- ============================================================================
-- Allows non-friends to request a message thread.
-- Run this in Supabase SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.message_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT message_requests_pkey PRIMARY KEY (id),
  CONSTRAINT message_requests_unique UNIQUE (sender_id, receiver_id),
  CONSTRAINT message_requests_not_self CHECK (sender_id != receiver_id)
);

CREATE INDEX IF NOT EXISTS message_requests_sender_idx ON public.message_requests(sender_id);
CREATE INDEX IF NOT EXISTS message_requests_receiver_idx ON public.message_requests(receiver_id);
CREATE INDEX IF NOT EXISTS message_requests_status_idx ON public.message_requests(status);

ALTER TABLE public.message_requests ENABLE ROW LEVEL SECURITY;

-- Policies
DROP POLICY IF EXISTS "Users can view their own message requests" ON public.message_requests;
DROP POLICY IF EXISTS "Users can send message requests" ON public.message_requests;
DROP POLICY IF EXISTS "Users can update received message requests" ON public.message_requests;
DROP POLICY IF EXISTS "Users can delete their own message requests" ON public.message_requests;

CREATE POLICY "Users can view their own message requests"
ON public.message_requests FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send message requests"
ON public.message_requests FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update received message requests"
ON public.message_requests FOR UPDATE
USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete their own message requests"
ON public.message_requests FOR DELETE
USING (sender_id = auth.uid() OR receiver_id = auth.uid());
