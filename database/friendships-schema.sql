-- ============================================================================
-- Friendships Schema for Bonded
-- ============================================================================
-- Tables:
-- 1. friend_requests - Pending friend requests
-- 2. friendships - Confirmed friendships (bidirectional)
--
-- Flow:
-- 1. User A sends request to User B -> creates friend_request row
-- 2. User B accepts -> creates friendship row, deletes request
-- 3. User B declines -> deletes request
--
-- Run this in Supabase SQL Editor.
-- ============================================================================

-- 1) Friend Requests table
CREATE TABLE IF NOT EXISTS public.friend_requests (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  message text, -- Optional message with request
  status text NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'declined')),
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  updated_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT friend_requests_pkey PRIMARY KEY (id),
  CONSTRAINT friend_requests_unique UNIQUE (sender_id, receiver_id),
  CONSTRAINT friend_requests_not_self CHECK (sender_id != receiver_id)
);

-- 2) Friendships table (bidirectional - one row per friendship)
CREATE TABLE IF NOT EXISTS public.friendships (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  created_at timestamptz NOT NULL DEFAULT timezone('utc', now()),
  CONSTRAINT friendships_pkey PRIMARY KEY (id),
  CONSTRAINT friendships_unique UNIQUE (user1_id, user2_id),
  CONSTRAINT friendships_not_self CHECK (user1_id != user2_id),
  -- Ensure user1_id < user2_id to prevent duplicate friendships
  CONSTRAINT friendships_ordered CHECK (user1_id < user2_id)
);

-- 3) Indexes for performance
CREATE INDEX IF NOT EXISTS friend_requests_sender_idx ON public.friend_requests(sender_id);
CREATE INDEX IF NOT EXISTS friend_requests_receiver_idx ON public.friend_requests(receiver_id);
CREATE INDEX IF NOT EXISTS friend_requests_status_idx ON public.friend_requests(status);
CREATE INDEX IF NOT EXISTS friendships_user1_idx ON public.friendships(user1_id);
CREATE INDEX IF NOT EXISTS friendships_user2_idx ON public.friendships(user2_id);

-- 4) Function to check if two users are friends
CREATE OR REPLACE FUNCTION public.are_friends(user_a uuid, user_b uuid)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  smaller_id uuid := LEAST(user_a, user_b);
  larger_id uuid := GREATEST(user_a, user_b);
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM friendships
    WHERE user1_id = smaller_id AND user2_id = larger_id
  );
END;
$$;

-- 5) Function to get friend count
CREATE OR REPLACE FUNCTION public.get_friend_count(user_id uuid)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN (
    SELECT COUNT(*) FROM friendships
    WHERE user1_id = user_id OR user2_id = user_id
  );
END;
$$;

-- ============================================================================
-- RLS Policies
-- ============================================================================

ALTER TABLE public.friend_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.friendships ENABLE ROW LEVEL SECURITY;

-- Drop existing policies
DROP POLICY IF EXISTS "Users can view their own friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can send friend requests" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can update requests they received" ON public.friend_requests;
DROP POLICY IF EXISTS "Users can delete their own requests" ON public.friend_requests;

DROP POLICY IF EXISTS "Users can view their own friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can create friendships" ON public.friendships;
DROP POLICY IF EXISTS "Users can delete their own friendships" ON public.friendships;

-- Friend Requests policies
CREATE POLICY "Users can view their own friend requests"
ON public.friend_requests FOR SELECT
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "Users can send friend requests"
ON public.friend_requests FOR INSERT
WITH CHECK (sender_id = auth.uid());

CREATE POLICY "Users can update requests they received"
ON public.friend_requests FOR UPDATE
USING (receiver_id = auth.uid());

CREATE POLICY "Users can delete their own requests"
ON public.friend_requests FOR DELETE
USING (sender_id = auth.uid() OR receiver_id = auth.uid());

-- Friendships policies
CREATE POLICY "Users can view their own friendships"
ON public.friendships FOR SELECT
USING (user1_id = auth.uid() OR user2_id = auth.uid());

CREATE POLICY "Users can create friendships"
ON public.friendships FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

CREATE POLICY "Users can delete their own friendships"
ON public.friendships FOR DELETE
USING (user1_id = auth.uid() OR user2_id = auth.uid());

SELECT 'Friendships schema created successfully!' AS status;

