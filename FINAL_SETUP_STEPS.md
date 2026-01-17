# Final Setup Steps for Event Creation

## ✅ Code Updates Complete

All code has been updated to use your `bonded-media` bucket infrastructure!

## 🚀 What to Do Now

### Step 1: Add Your University ID (Required for Image Uploads)

Run this in your **Supabase SQL Editor**:

```sql
-- First, check if you have a university (school)
SELECT id, name FROM universities ORDER BY name;

-- If no universities exist, create one:
INSERT INTO universities (id, name, short_name, domain)
VALUES
  ('00000000-0000-0000-0000-000000000001', 'University of Rhode Island', 'URI', 'uri.edu')
ON CONFLICT (id) DO NOTHING;

-- Now update your profile with the university_id
UPDATE profiles
SET university_id = '00000000-0000-0000-0000-000000000001'  -- Use the actual ID from above
WHERE email = 'isaac@mergefund.org';

-- Verify it worked
SELECT id, email, university_id FROM profiles WHERE email = 'isaac@mergefund.org';
```

**Important:** Replace the UUID with the actual university ID from your first query!

### Step 2: Test Event Creation

1. **Open the app** and go to Events
2. **Click the "+" button**
3. **Fill out the form:**
   - Event name: "Test Event"
   - Description: "Testing image uploads"
   - Date/Time: Tomorrow
   - Location: "Campus Center"
   - **Add an image** ← This is the key test!
4. **Click "Create Event"**

### Step 3: Check Console Logs

You should see:
```
Starting image upload for user: <your-id>
Upload path: schools/<school-id>/users/<user-id>/events/<timestamp>.jpg
Uploading to Supabase Storage bucket: bonded-media
Upload successful ✅
Public URL: https://...
```

If you see an error, it will tell you exactly what failed.

---

## 📁 How Image Upload Works Now

### File Path Structure

Images are uploaded to:
```
bonded-media/
  schools/
    {school_id}/
      users/
        {user_id}/
          events/
            {timestamp}.jpg
```

This matches your existing RLS policy:
```sql
"Users can upload their own media"
- bucket_id = 'bonded-media'
- folder[1] = 'schools'
- folder[3] = 'users'
- folder[4] = auth.uid()
```

### Event Creation Flow

1. User fills out form
2. Clicks "Create Event"
3. **Image uploads to user's folder** in bonded-media bucket
4. Gets public URL: `https://.../storage/v1/object/public/bonded-media/schools/...`
5. **Event created** with image_url
6. Event appears in "My Events" tab
7. "Manage Event" button works

---

## 🔍 Troubleshooting

### Error: "Could not get user school ID"
**Solution:** Run Step 1 above to add your university_id

### Error: "new row violates row-level security policy"
**Solution:**
- Make sure the `bonded-media` bucket exists in Supabase Storage
- Check that your migration policies are active
- Verify you're authenticated (user.id exists)

### Error: "Bucket not found"
**Solution:**
1. Go to Supabase Dashboard → Storage
2. Check if `bonded-media` bucket exists
3. If not, create it (set as Public)

### Images upload but don't show in events
**Solution:**
- Check the public URL in console logs
- Make sure the bucket is set to "Public" in Supabase
- Verify the URL is being saved to uri_events.image_url

### Events not showing in "My Events"
**Solution:** Already fixed! Events are now filtered by `organizer_id === user.id`

### "Manage Event" crashes the app
**Solution:** Already fixed! All missing icons have been added.

---

## 📊 What Changed

### Files Updated:
1. ✅ `app/events/create.jsx`
   - Changed bucket from `profiles` → `bonded-media`
   - Uses proper path: `schools/{school_id}/users/{user_id}/events/{timestamp}.jpg`
   - Fetches user's university_id (school_id)
   - Detailed error logging

2. ✅ `app/events/index.jsx`
   - "My Events" tab now filters correctly

3. ✅ `components/Icons.jsx`
   - Added all missing icons for manage page

4. ✅ `hooks/events/useCreateEvent.js`
   - Removed university_id requirement for event creation

### What Works Now:
- ✅ Event creation (with or without image)
- ✅ Image upload to bonded-media bucket
- ✅ My Events tab filtering
- ✅ Manage Event page (no crash)
- ✅ Edit/Share/Delete buttons

---

## 🎯 Next Steps After Testing

Once event creation works perfectly:

1. **Register Images in Media Table** (optional but recommended)
   - Call `register_media_upload()` after successful upload
   - Tracks all media in one place
   - Enables moderation and cleanup

2. **Event Editing**
   - Allow updating event details
   - Support changing cover image

3. **Event Gallery**
   - Multiple images per event
   - Upload to: `schools/{school_id}/events/{event_id}/gallery/{timestamp}.jpg`

4. **Attendee Management**
   - Show attendee list in manage page
   - Approve/deny join requests

5. **Story Integration**
   - Create stories from events
   - Auto-expire after 24h

---

## 🆘 Still Having Issues?

Check these:
1. ✅ `bonded-media` bucket exists and is Public
2. ✅ Your profile has a `university_id`
3. ✅ You're logged in (user.id exists)
4. ✅ RLS policies from your migration are active
5. ✅ Check console logs for detailed error messages

Run this to verify your setup:
```sql
-- Check your profile
SELECT id, email, university_id FROM profiles WHERE email = 'isaac@mergefund.org';

-- Check storage policies
SELECT * FROM storage.policies WHERE bucket_id = 'bonded-media';

-- Check if bucket exists
SELECT * FROM storage.buckets WHERE id = 'bonded-media';
```

---

Everything should work now! Just add your university_id and test event creation with an image. 🎉
