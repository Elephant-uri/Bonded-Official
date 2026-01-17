-- ============================================================================
-- SETUP EVENT IMAGE STORAGE
-- ============================================================================
-- Run this in your Supabase SQL Editor to fix image upload issues
-- ============================================================================

-- OPTION 1: Create a dedicated 'events' bucket (Recommended)
-- ============================================================================
-- This creates a separate bucket just for event images

-- Create the bucket (run this in the Supabase Dashboard > Storage, or via SQL)
-- Note: You might need to create this in the Dashboard instead
-- Go to: Storage > Create bucket > Name: "events" > Public: Yes

-- Then set the policies via SQL:

-- Allow authenticated users to upload event images
CREATE POLICY "Authenticated users can upload event images"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow public read access to event images
CREATE POLICY "Anyone can view event images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'events');

-- Allow users to update their own event images
CREATE POLICY "Users can update their own event images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Allow users to delete their own event images
CREATE POLICY "Users can delete their own event images"
ON storage.objects
FOR DELETE
TO authenticated
USING (bucket_id = 'events' AND auth.uid()::text = (storage.foldername(name))[1]);

-- ============================================================================
-- OPTION 2: Use existing 'profiles' bucket
-- ============================================================================
-- If you already have a 'profiles' bucket and want to use it for events too

-- Check if the profiles bucket policies allow event image uploads
-- Run this to see existing policies:
-- SELECT * FROM storage.policies WHERE bucket_id = 'profiles';

-- If needed, add policies for event images in the profiles bucket:

CREATE POLICY "Authenticated users can upload to profiles bucket"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Anyone can view files in profiles bucket"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'profiles');

CREATE POLICY "Users can update their own files in profiles bucket"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own files in profiles bucket"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'profiles'
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- ============================================================================
-- VERIFICATION
-- ============================================================================

-- Check storage buckets
-- SELECT * FROM storage.buckets;

-- Check storage policies
-- SELECT * FROM storage.policies WHERE bucket_id IN ('events', 'profiles');

-- ============================================================================
-- NOTES
-- ============================================================================
--
-- File paths will be: {user_id}/events/{timestamp}.jpg
-- This ensures each user can only upload to their own folder
--
-- If you choose Option 1 (events bucket), update app/events/create.jsx:
-- Change: .from('profiles')
-- To:     .from('events')
--
-- If you choose Option 2 (profiles bucket), no code changes needed
-- But make sure the policies above are in place
-- ============================================================================
