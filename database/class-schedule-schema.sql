-- ============================================
-- Class Schedule Schema
-- Supports schedule upload, class organization, and connecting classmates
-- ============================================

-- ============================================
-- Step 1: Create classes table (master list of all classes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.classes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  university_id uuid REFERENCES public.universities(id) ON DELETE CASCADE,
  class_code text NOT NULL, -- e.g., "CS 201"
  class_name text NOT NULL, -- e.g., "Data Structures"
  department text, -- e.g., "Computer Science"
  credits integer,
  description text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(university_id, class_code) -- Prevent duplicate class codes per university
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_classes_university_code ON public.classes(university_id, class_code);
CREATE INDEX IF NOT EXISTS idx_classes_department ON public.classes(university_id, department);

-- ============================================
-- Step 2: Create class_sections table (specific sections/instances of a class)
-- ============================================
CREATE TABLE IF NOT EXISTS public.class_sections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  section_number text, -- e.g., "001", "A", "LEC 1"
  professor_name text,
  professor_email text,
  semester text, -- e.g., "Fall 2024", "Spring 2025"
  term_code text, -- e.g., "2024FA", "2025SP"
  days_of_week text[], -- e.g., ['Monday', 'Wednesday', 'Friday']
  start_time time,
  end_time time,
  location text, -- e.g., "Ballentine Hall 101"
  enrollment_capacity integer,
  current_enrollment integer DEFAULT 0,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_class_sections_class ON public.class_sections(class_id);
CREATE INDEX IF NOT EXISTS idx_class_sections_semester ON public.class_sections(semester, term_code);

-- ============================================
-- Step 3: Create user_class_enrollments table (users enrolled in classes)
-- ============================================
CREATE TABLE IF NOT EXISTS public.user_class_enrollments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE CASCADE,
  class_id uuid REFERENCES public.classes(id) ON DELETE CASCADE,
  section_id uuid REFERENCES public.class_sections(id) ON DELETE SET NULL,
  semester text NOT NULL, -- e.g., "Fall 2024"
  term_code text NOT NULL, -- e.g., "2024FA"
  enrollment_type text DEFAULT 'student', -- 'student', 'ta', 'professor'
  is_active boolean DEFAULT true, -- For current vs past enrollments
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now(),
  UNIQUE(user_id, class_id, semester) -- Prevent duplicate enrollments
);

-- Indexes for fast queries
CREATE INDEX IF NOT EXISTS idx_enrollments_user ON public.user_class_enrollments(user_id, is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_class ON public.user_class_enrollments(class_id, is_active);
CREATE INDEX IF NOT EXISTS idx_enrollments_semester ON public.user_class_enrollments(semester, term_code);
CREATE INDEX IF NOT EXISTS idx_enrollments_user_class ON public.user_class_enrollments(user_id, class_id, is_active);

-- ============================================
-- Step 4: Update forums table to support class_id (must be before functions that use it)
-- ============================================
-- Note: forums table must exist (created by forum-features-schema.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forums') THEN
    ALTER TABLE public.forums 
    ADD COLUMN IF NOT EXISTS class_id uuid REFERENCES public.classes(id) ON DELETE SET NULL;

    CREATE INDEX IF NOT EXISTS idx_forums_class ON public.forums(class_id);
  END IF;
END $$;

-- ============================================
-- Step 5: Auto-create forums for classes
-- ============================================
-- This function creates a forum for a class if it doesn't exist
CREATE OR REPLACE FUNCTION public.ensure_class_forum(class_uuid uuid)
RETURNS uuid AS $$
DECLARE
  forum_id uuid;
  class_record record;
  is_enrolled boolean;
BEGIN
  -- SECURITY: Verify user is enrolled in the class
  SELECT EXISTS(
    SELECT 1 FROM public.user_class_enrollments
    WHERE class_id = class_uuid
      AND user_id = auth.uid()
      AND is_active = true
  ) INTO is_enrolled;
  
  IF NOT is_enrolled THEN
    RAISE EXCEPTION 'Access denied: Not enrolled in this class';
  END IF;
  
  -- Get class details
  SELECT c.*, u.id as university_id INTO class_record
  FROM public.classes c
  JOIN public.universities u ON u.id = c.university_id
  WHERE c.id = class_uuid;
  
  IF NOT FOUND THEN
    RAISE EXCEPTION 'Class not found';
  END IF;
  
  -- Check if forum already exists
  SELECT id INTO forum_id
  FROM public.forums
  WHERE name = class_record.class_code || ' – ' || class_record.class_name
    AND university_id = class_record.university_id
    AND type = 'class'
  LIMIT 1;
  
  -- Create forum if it doesn't exist
  IF forum_id IS NULL THEN
    INSERT INTO public.forums (
      name,
      description,
      university_id,
      type,
      is_public,
      class_id,
      created_at
    )
    VALUES (
      class_record.class_code || ' – ' || class_record.class_name,
      'Discussion forum for ' || class_record.class_code || ': ' || class_record.class_name,
      class_record.university_id,
      'class',
      false, -- Class forums are private to enrolled students
      class_uuid,
      now()
    )
    RETURNING id INTO forum_id;
  END IF;
  
  RETURN forum_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 6: Trigger to auto-create forum when class gets first enrollment
-- ============================================
CREATE OR REPLACE FUNCTION public.auto_create_class_forum_on_enrollment()
RETURNS TRIGGER AS $$
DECLARE
  forum_id uuid;
BEGIN
  -- Ensure forum exists for this class
  SELECT public.ensure_class_forum(NEW.class_id) INTO forum_id;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_class_enrollment_create_forum
  AFTER INSERT ON public.user_class_enrollments
  FOR EACH ROW
  EXECUTE FUNCTION public.auto_create_class_forum_on_enrollment();

-- ============================================
-- Step 7: Function to find classmates (users in same classes)
-- ============================================
CREATE OR REPLACE FUNCTION public.find_classmates(user_uuid uuid, semester_filter text DEFAULT NULL)
RETURNS TABLE (
  user_id uuid,
  shared_classes jsonb,
  shared_class_count bigint
) AS $$
BEGIN
  -- SECURITY: Only allow querying own classmates
  IF user_uuid != auth.uid() THEN
    RAISE EXCEPTION 'Access denied: Cannot query classmates for other users';
  END IF;
  
  RETURN QUERY
  WITH user_classes AS (
    SELECT class_id, semester
    FROM public.user_class_enrollments
    WHERE user_id = user_uuid
      AND is_active = true
      AND (semester_filter IS NULL OR semester = semester_filter)
  ),
  classmates AS (
    SELECT 
      uce.user_id,
      array_agg(
        jsonb_build_object(
          'class_id', uce.class_id,
          'class_code', c.class_code,
          'class_name', c.class_name,
          'semester', uce.semester
        )
      ) as shared_classes,
      COUNT(*) as shared_class_count
    FROM public.user_class_enrollments uce
    JOIN user_classes uc ON uc.class_id = uce.class_id AND uc.semester = uce.semester
    JOIN public.classes c ON c.id = uce.class_id
    WHERE uce.user_id != user_uuid
      AND uce.is_active = true
    GROUP BY uce.user_id
    HAVING COUNT(*) > 0
    ORDER BY shared_class_count DESC
  )
  SELECT * FROM classmates;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- Step 8: Row Level Security (RLS) Policies
-- ============================================

-- Classes table: Anyone from same university can view
ALTER TABLE public.classes ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view classes from their university" ON public.classes;
CREATE POLICY "Users can view classes from their university"
  ON public.classes FOR SELECT
  USING (
    auth.uid() IS NOT NULL  -- Require authentication
    AND university_id IN (
      SELECT university_id FROM public.profiles WHERE id = auth.uid()
    )
  );

-- Class sections: Same as classes
ALTER TABLE public.class_sections ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view sections from their university" ON public.class_sections;
CREATE POLICY "Users can view sections from their university"
  ON public.class_sections FOR SELECT
  USING (
    class_id IN (
      SELECT id FROM public.classes 
      WHERE university_id IN (
        SELECT university_id FROM public.profiles WHERE id = auth.uid()
      )
    )
  );

-- User enrollments: Users can see their own and classmates' enrollments
ALTER TABLE public.user_class_enrollments ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can view their own enrollments" ON public.user_class_enrollments;
CREATE POLICY "Users can view their own enrollments"
  ON public.user_class_enrollments FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can view classmates' enrollments" ON public.user_class_enrollments;
CREATE POLICY "Users can view classmates' enrollments"
  ON public.user_class_enrollments FOR SELECT
  USING (
    -- User can see enrollments for classes they're also enrolled in
    class_id IN (
      SELECT class_id 
      FROM public.user_class_enrollments 
      WHERE user_id = auth.uid() 
        AND is_active = true
    )
  );

DROP POLICY IF EXISTS "Users can insert their own enrollments" ON public.user_class_enrollments;
CREATE POLICY "Users can insert their own enrollments"
  ON public.user_class_enrollments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own enrollments" ON public.user_class_enrollments;
CREATE POLICY "Users can update their own enrollments"
  ON public.user_class_enrollments FOR UPDATE
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can delete their own enrollments" ON public.user_class_enrollments;
CREATE POLICY "Users can delete their own enrollments"
  ON public.user_class_enrollments FOR DELETE
  USING (auth.uid() = user_id);

-- ============================================
-- Step 9: Update forum RLS to allow class forum access
-- ============================================
-- Update existing policy to include class forum access
-- Note: forums table must exist (created by forum-features-schema.sql)
DO $$
BEGIN
  IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_schema = 'public' AND table_name = 'forums') THEN
    -- Drop and recreate the existing policy with class forum support
    DROP POLICY IF EXISTS "Users can view forums from their university" ON public.forums;
    CREATE POLICY "Users can view forums from their university"
      ON public.forums FOR SELECT
      USING (
        auth.uid() IS NOT NULL  -- Require authentication
        AND (
          -- Campus forums: same university
          university_id IN (
            SELECT university_id FROM public.profiles WHERE id = auth.uid()
          )
          OR
          -- Class forums: users enrolled in the class can access
          (type = 'class' AND class_id IN (
            SELECT class_id 
            FROM public.user_class_enrollments 
            WHERE user_id = auth.uid() 
              AND is_active = true
          ))
        )
      );
  END IF;
END $$;

-- ============================================
-- Notes:
-- 1. Classes are organized by university
-- 2. Class sections represent specific instances (professor, time, location)
-- 3. User enrollments link users to classes/sections
-- 4. Forums are auto-created when first user enrolls
-- 5. Class forums are private to enrolled students
-- 6. Users can find classmates via find_classmates() function
-- 7. Schedule can be stored as JSONB in profiles.class_schedule for quick access
-- 8. Full schedule details are in user_class_enrollments table
-- 9. IMPORTANT: Run forum-features-schema.sql BEFORE this file
--    (forums table must exist for class_id column and RLS policy)
-- ============================================

