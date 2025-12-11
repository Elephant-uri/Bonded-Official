-- ============================================
-- Bonded Seed Data Script
-- Run this AFTER setting up your database schema
-- and AFTER creating at least one verified user
-- ============================================

-- IMPORTANT: Replace 'YOUR_USER_ID_HERE' with an actual user ID from auth.users
-- You can get a user ID by:
-- 1. Signing up a test user via the app
-- 2. Going to Supabase Dashboard → Authentication → Users
-- 3. Copy the UUID of a verified user

-- ============================================
-- Step 1: Seed Universities (if not already done)
-- ============================================
INSERT INTO public.universities (name, domain, created_at)
VALUES
  ('University of Rhode Island', 'uri.edu', now()),
  ('Brown University', 'brown.edu', now()),
  ('Rhode Island College', 'ric.edu', now()),
  ('Providence College', 'providence.edu', now()),
  ('Bryant University', 'bryant.edu', now())
ON CONFLICT (domain) DO NOTHING;

-- ============================================
-- Step 2: Seed Forums for Each University
-- ============================================
DO $$
DECLARE
  uni_record RECORD;
  main_forum_id uuid;
  events_forum_id uuid;
  clubs_forum_id uuid;
  housing_forum_id uuid;
  academic_forum_id uuid;
BEGIN
  -- Loop through each university
  FOR uni_record IN SELECT id, name FROM public.universities LOOP
    -- Main Forum
    INSERT INTO public.forums (name, description, university_id, type, is_public, created_at)
    VALUES ('Main Forum', 'General campus discussions', uni_record.id, 'campus', true, now() - interval '30 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO main_forum_id;
    
    -- Get the ID if it already exists
    SELECT id INTO main_forum_id FROM public.forums 
    WHERE name = 'Main Forum' AND university_id = uni_record.id LIMIT 1;
    
    -- Campus Events
    INSERT INTO public.forums (name, description, university_id, type, is_public, created_at)
    VALUES ('Campus Events', 'Events and happenings on campus', uni_record.id, 'campus', true, now() - interval '30 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO events_forum_id;
    
    SELECT id INTO events_forum_id FROM public.forums 
    WHERE name = 'Campus Events' AND university_id = uni_record.id LIMIT 1;
    
    -- Clubs & Organizations
    INSERT INTO public.forums (name, description, university_id, type, is_public, created_at)
    VALUES ('Clubs & Organizations', 'Student clubs and orgs', uni_record.id, 'campus', true, now() - interval '30 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO clubs_forum_id;
    
    SELECT id INTO clubs_forum_id FROM public.forums 
    WHERE name = 'Clubs & Organizations' AND university_id = uni_record.id LIMIT 1;
    
    -- Housing & Roommates
    INSERT INTO public.forums (name, description, university_id, type, is_public, created_at)
    VALUES ('Housing & Roommates', 'Housing and roommate discussions', uni_record.id, 'campus', true, now() - interval '30 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO housing_forum_id;
    
    SELECT id INTO housing_forum_id FROM public.forums 
    WHERE name = 'Housing & Roommates' AND university_id = uni_record.id LIMIT 1;
    
    -- Academic
    INSERT INTO public.forums (name, description, university_id, type, is_public, created_at)
    VALUES ('Academic', 'Study groups and academic discussions', uni_record.id, 'campus', true, now() - interval '30 days')
    ON CONFLICT DO NOTHING
    RETURNING id INTO academic_forum_id;
    
    SELECT id INTO academic_forum_id FROM public.forums 
    WHERE name = 'Academic' AND university_id = uni_record.id LIMIT 1;
  END LOOP;
END $$;

-- ============================================
-- Step 3: Seed Posts (REQUIRES A USER ID)
-- ============================================
-- Replace 'YOUR_USER_ID_HERE' with actual user UUID
-- This creates welcome posts and sample content

DO $$
DECLARE
  seed_user_id uuid;
  forum_record RECORD;
  post_titles text[] := ARRAY[
    'Welcome to Bonded!',
    'Looking for study buddies?',
    'Campus Events This Week',
    'Join Student Organizations',
    'Housing Opportunities',
    'Study Tips & Resources',
    'Campus Life Discussions',
    'Find Your People'
  ];
  post_bodies text[] := ARRAY[
    'Welcome to your campus community! Start connecting with fellow students and make the most of your college experience.',
    'Post here to find study groups, partners, and academic support. Let''s help each other succeed!',
    'Share and discover events happening on campus. From sports games to club meetings, stay in the loop!',
    'Discover student organizations, clubs, and groups. Find your community and get involved!',
    'Looking for roommates, housing, or have housing questions? This is the place to discuss.',
    'Share study strategies, resources, and tips. Help your peers and learn from others.',
    'General campus life discussions. Ask questions, share experiences, and connect with your campus community.',
    'This is your space to find friends, study partners, roommates, and people who share your interests.'
  ];
  random_title text;
  random_body text;
  days_ago integer;
BEGIN
  -- Get first verified user (you should replace this with a specific user ID)
  SELECT id INTO seed_user_id
  FROM public.profiles
  WHERE is_verified = true
  LIMIT 1;
  
  -- If no verified user exists, exit
  IF seed_user_id IS NULL THEN
    RAISE NOTICE 'No verified users found. Please create a user first, then run this script again.';
    RETURN;
  END IF;
  
  RAISE NOTICE 'Using user ID: %', seed_user_id;
  
  -- Create posts for each campus forum
  FOR forum_record IN 
    SELECT f.id, f.name, f.university_id, u.name as university_name
    FROM public.forums f
    JOIN public.universities u ON u.id = f.university_id
    WHERE f.type = 'campus'
  LOOP
    -- Create 3-5 posts per forum with varied timestamps
    FOR i IN 1..5 LOOP
      -- Random title and body
      random_title := post_titles[1 + floor(random() * array_length(post_titles, 1))::int];
      random_body := post_bodies[1 + floor(random() * array_length(post_bodies, 1))::int];
      days_ago := floor(random() * 7)::int; -- Random 0-7 days ago
      
      -- Insert post
      INSERT INTO public.posts (
        forum_id,
        user_id,
        title,
        body,
        is_anonymous,
        created_at,
        updated_at
      )
      VALUES (
        forum_record.id,
        seed_user_id,
        random_title || ' - ' || forum_record.university_name,
        random_body,
        false,
        now() - (days_ago || ' days')::interval,
        now() - (days_ago || ' days')::interval
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
    
    RAISE NOTICE 'Created posts for forum: %', forum_record.name;
  END LOOP;
END $$;

-- ============================================
-- Step 4: Seed Sample Events (Optional)
-- ============================================
DO $$
DECLARE
  seed_user_id uuid;
  uni_record RECORD;
  event_titles text[] := ARRAY[
    'Basketball Game',
    'Study Session',
    'Club Meeting',
    'Campus Tour',
    'Workshop',
    'Social Mixer',
    'Guest Speaker',
    'Movie Night'
  ];
  random_title text;
  days_from_now integer;
BEGIN
  -- Get first verified user
  SELECT id INTO seed_user_id
  FROM public.profiles
  WHERE is_verified = true
  LIMIT 1;
  
  IF seed_user_id IS NULL THEN
    RETURN;
  END IF;
  
  -- Create events for each university
  FOR uni_record IN SELECT id, name FROM public.universities LOOP
    -- Create 2-3 events per university
    FOR i IN 1..3 LOOP
      random_title := event_titles[1 + floor(random() * array_length(event_titles, 1))::int];
      days_from_now := floor(random() * 14)::int; -- Random 0-14 days from now
      
      INSERT INTO public.events (
        organizer_id,
        title,
        description,
        start_at,
        end_at,
        location_name,
        visibility,
        created_by,
        created_at
      )
      VALUES (
        seed_user_id,
        random_title || ' at ' || uni_record.name,
        'Join us for this exciting event!',
        now() + (days_from_now || ' days')::interval + (floor(random() * 12) || ' hours')::interval,
        now() + (days_from_now || ' days')::interval + (floor(random() * 12) + 2 || ' hours')::interval,
        'Campus Location',
        'public',
        seed_user_id,
        now() - interval '2 days'
      )
      ON CONFLICT DO NOTHING;
    END LOOP;
  END LOOP;
END $$;

-- ============================================
-- Step 5: Verify Seeded Data
-- ============================================
DO $$
DECLARE
  forum_count integer;
  post_count integer;
  event_count integer;
BEGIN
  SELECT COUNT(*) INTO forum_count FROM public.forums;
  SELECT COUNT(*) INTO post_count FROM public.posts;
  SELECT COUNT(*) INTO event_count FROM public.events;
  
  RAISE NOTICE '========================================';
  RAISE NOTICE 'Seed Data Summary:';
  RAISE NOTICE 'Forums created: %', forum_count;
  RAISE NOTICE 'Posts created: %', post_count;
  RAISE NOTICE 'Events created: %', event_count;
  RAISE NOTICE '========================================';
  
  IF post_count = 0 THEN
    RAISE WARNING 'No posts were created. Make sure you have at least one verified user.';
  END IF;
END $$;

-- ============================================
-- Notes:
-- 1. Run this script AFTER creating at least one verified user
-- 2. The script will automatically find the first verified user
-- 3. If you want to use a specific user, replace the SELECT query with a specific UUID
-- 4. Posts are created with random timestamps (0-7 days ago) for realism
-- 5. Events are created with random future dates (0-14 days from now)
-- 6. Run this script multiple times safely (ON CONFLICT prevents duplicates)
-- ============================================

