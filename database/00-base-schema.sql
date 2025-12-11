-- ============================================
-- BONDED APP - BASE SCHEMA (RUN THIS FIRST!)
-- Creates the foundational tables required by all other schemas
-- ============================================

-- ============================================
-- UNIVERSITIES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.universities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  domain text UNIQUE NOT NULL, -- e.g., "uri.edu", "brown.edu"
  location text,
  logo_url text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_universities_domain ON public.universities(domain);

-- ============================================
-- PROFILES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text NOT NULL,
  full_name text,
  username text UNIQUE,
  bio text,
  avatar_url text,
  university_id uuid REFERENCES public.universities(id) ON DELETE SET NULL,
  is_verified boolean DEFAULT false,
  verification_expires_at timestamptz,
  onboarding_complete boolean DEFAULT false,
  yearbook_visible boolean DEFAULT true, -- For yearbook visibility
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  
  -- Additional fields that may be added by other schemas
  age integer,
  grade text, -- 'Freshman', 'Sophomore', 'Junior', 'Senior', 'Graduate'
  gender text,
  major text,
  graduation_year integer,
  interests jsonb DEFAULT '[]'::jsonb,
  personality_tags jsonb DEFAULT '[]'::jsonb,
  role text DEFAULT 'user' CHECK (role IN ('user', 'admin', 'moderator'))
);

CREATE INDEX IF NOT EXISTS idx_profiles_university ON public.profiles(university_id);
CREATE INDEX IF NOT EXISTS idx_profiles_username ON public.profiles(username);
CREATE INDEX IF NOT EXISTS idx_profiles_email ON public.profiles(email);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role) WHERE role IN ('admin', 'moderator');

-- ============================================
-- MESSAGES TABLE (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  conversation_id uuid, -- Reference to conversations table if you have one
  sender_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  recipient_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE,
  message_text text NOT NULL,
  is_anonymous boolean DEFAULT false,
  is_revealed boolean DEFAULT false, -- If sender reveals identity
  is_read boolean DEFAULT false,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_messages_sender ON public.messages(sender_id);
CREATE INDEX IF NOT EXISTS idx_messages_recipient ON public.messages(recipient_id);
CREATE INDEX IF NOT EXISTS idx_messages_conversation ON public.messages(conversation_id) WHERE conversation_id IS NOT NULL;

-- ============================================
-- CONVERSATIONS TABLE (if needed for messages)
-- ============================================
CREATE TABLE IF NOT EXISTS public.conversations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user1_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  user2_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  last_message_at timestamptz DEFAULT now(),
  created_at timestamptz DEFAULT now(),
  
  UNIQUE(user1_id, user2_id),
  CHECK (user1_id < user2_id) -- Ensure consistent ordering
);

CREATE INDEX IF NOT EXISTS idx_conversations_user1 ON public.conversations(user1_id);
CREATE INDEX IF NOT EXISTS idx_conversations_user2 ON public.conversations(user2_id);

-- ============================================
-- ORGS TABLE (if it doesn't exist - adjust name if yours is different)
-- ============================================
-- Check if orgs/organizations/clubs table exists, create if not
DO $$
BEGIN
  -- Try to create orgs table (adjust name if yours is 'organizations' or 'clubs')
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.tables 
    WHERE table_schema = 'public' 
    AND table_name IN ('orgs', 'organizations', 'clubs')
  ) THEN
    CREATE TABLE IF NOT EXISTS public.orgs (
      id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
      name text NOT NULL,
      description text,
      university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
      logo_url text,
      created_at timestamptz DEFAULT now(),
      updated_at timestamptz DEFAULT now()
    );
    
    CREATE INDEX IF NOT EXISTS idx_orgs_university ON public.orgs(university_id);
  END IF;
END $$;

-- ============================================
-- ORG MEMBERS TABLE (if it doesn't exist)
-- ============================================
CREATE TABLE IF NOT EXISTS public.org_members (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  org_id uuid, -- References orgs/organizations/clubs (adjust as needed)
  user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
  role text DEFAULT 'member' CHECK (role IN ('member', 'officer', 'admin')),
  joined_at timestamptz DEFAULT now(),
  
  UNIQUE(org_id, user_id)
);

CREATE INDEX IF NOT EXISTS idx_org_members_org ON public.org_members(org_id);
CREATE INDEX IF NOT EXISTS idx_org_members_user ON public.org_members(user_id);

-- ============================================
-- ROW LEVEL SECURITY - BASE TABLES
-- ============================================

-- Universities: Anyone authenticated can view
ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone can view universities" ON public.universities;
CREATE POLICY "Anyone can view universities"
  ON public.universities FOR SELECT
  USING (auth.uid() IS NOT NULL);

-- Profiles: Already handled in setup.sql, but ensure RLS is enabled
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Messages: Users can see messages in their conversations
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view messages in their conversations" ON public.messages;
CREATE POLICY "Users can view messages in their conversations"
  ON public.messages FOR SELECT
  USING (
    sender_id = auth.uid() 
    OR recipient_id = auth.uid()
    OR conversation_id IN (
      SELECT id FROM public.conversations
      WHERE user1_id = auth.uid() OR user2_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "Users can send messages" ON public.messages;
CREATE POLICY "Users can send messages"
  ON public.messages FOR INSERT
  WITH CHECK (auth.uid() = sender_id);

-- Conversations: Users can see their conversations
ALTER TABLE public.conversations ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their conversations" ON public.conversations;
CREATE POLICY "Users can view their conversations"
  ON public.conversations FOR SELECT
  USING (auth.uid() IN (user1_id, user2_id));

-- Org members: Users can see members of orgs they're in
ALTER TABLE public.org_members ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view org members" ON public.org_members;
CREATE POLICY "Users can view org members"
  ON public.org_members FOR SELECT
  USING (
    user_id = auth.uid()
    OR org_id IN (
      SELECT org_id FROM public.org_members WHERE user_id = auth.uid()
    )
  );

-- ============================================
-- NOTES:
-- 1. Run this file FIRST before any other schema files
-- 2. This creates the base tables that all other schemas depend on
-- 3. Adjust table names (orgs vs organizations vs clubs) as needed
-- 4. After this, run setup.sql, then other schema files
-- ============================================

