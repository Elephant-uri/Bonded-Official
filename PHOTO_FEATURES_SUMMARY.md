# Photo Features Implementation Summary

## Overview
Complete photo management system for user profiles including yearbook photos, banners, and photo galleries.

## Features Implemented

### 1. Onboarding - Photo Selection Step

**Yearbook Photo (Required)**
- Single photo selection with square cropping (1:1 aspect)
- Image processing to 800x800px
- Marked as `isYearbookPhoto: true`
- Serves as the main profile avatar
- Clear labeling as "yearbook photo"

**Photo Album (Optional)**
- Multi-select photo picker
- Add multiple photos to create a gallery
- Remove individual photos
- Photos marked as `isYearbookPhoto: false`
- Empty state when no gallery photos added

**Yearbook Quote (Optional)**
- Text input with 150 character limit
- Character counter
- Saved to `profiles.yearbook_quote`

### 2. Profile Page - Photo Management

**Avatar Editing**
- Change yearbook photo/avatar
- Square crop (1:1 aspect)
- Upload to `profile_avatar` media type
- Updates `profiles.avatar_url`

**Banner Editing**
- Change cover/banner image
- Widescreen crop (16:9 aspect)
- Upload to `profile_banner` media type
- Updates `profiles.banner_url`

**Photo Gallery Management**
- View all gallery photos in 3-column grid
- Add multiple photos
- Remove individual photos
- Set any photo as yearbook photo
- Star icon to promote gallery photo to yearbook photo
- Trash icon to delete photos
- Badge showing which photo is the yearbook photo
- Empty state when no photos

**Quote Editing**
- Edit yearbook quote
- 150 character limit with counter
- Updates `profiles.yearbook_quote`

### 3. Media Storage Architecture

**Media Types**
- `profile_avatar` - Main yearbook photo/avatar (single, upsertable)
- `profile_banner` - Cover/banner image (single, upsertable)
- `profile_photo` - Gallery photos (multiple)

**Storage Structure**
```
bonded-media/
└── universities/{university_id}/
    └── users/{user_id}/
        └── profile/
            ├── avatar.jpg      (upsertable)
            ├── banner.jpg      (upsertable)
            └── photos/
                ├── {mediaId1}.jpg
                ├── {mediaId2}.jpg
                └── {mediaId3}.jpg
```

### 4. Database Schema

**Profiles Table**
- `avatar_url` TEXT - URL to yearbook photo
- `banner_url` TEXT - URL to banner image (new)
- `yearbook_quote` TEXT - User's yearbook quote

**Media Table**
- Tracks all uploaded media with metadata
- Links to storage bucket paths
- Includes university_id for RLS policies

**RLS Policies**
- Users can INSERT/UPDATE their own profile media
- Users can SELECT profile media from their university
- Storage policies enforce path structure

## SQL Migration Files

1. `database/enable-profile-media.sql`
   - Adds media_type enum values
   - Creates storage.objects policies
   - Creates media table RLS policies

2. `database/add-banner-url-to-profiles.sql`
   - Adds banner_url column to profiles

## Upload Flow

### Onboarding
1. User selects yearbook photo → stored locally
2. User adds gallery photos → stored locally
3. User enters quote → stored in form state
4. On save, `useSaveOnboarding` hook:
   - Uploads yearbook photo to `profile_avatar`
   - Uploads gallery photos to `profile_photo`
   - Saves avatar_url and quote to profiles table

### Profile Editing
1. User changes avatar/banner/gallery → stored locally
2. User clicks "Save All Changes"
3. Photos upload to respective media types
4. Signed URLs generated
5. Profile updated with new URLs

## Key Components

- `components/onboarding/steps/PhotoSelectionStep.jsx` - Onboarding UI
- `app/profile.jsx` - Profile page with edit modal
- `hooks/useSaveOnboarding.js` - Save onboarding data including photos
- `hooks/useUpdateProfile.js` - Update profile data
- `helpers/uploadPhotos.js` - Photo upload utility
- `helpers/mediaStorage.js` - Media storage utilities

## User Experience

**Onboarding Flow:**
1. "Add your yearbook photo" - Primary photo with square crop
2. "Photo Album (Optional)" - Multi-select for gallery
3. "Yearbook Quote (Optional)" - Text input for quote
4. Clear tips and guidance throughout

**Profile Edit Flow:**
1. Tap ••• button on profile
2. Modal with sections for:
   - Profile Avatar (with preview)
   - Banner Image (with preview)
   - Name
   - Yearbook Quote
   - Photo Gallery (grid with actions)
3. "Save All Changes" button uploads and saves everything

## Next Steps (If Needed)

- [ ] Add photo reordering in gallery
- [ ] Add photo filters/editing
- [ ] Compress photos before upload
- [ ] Show upload progress for individual photos
- [ ] Add ability to select gallery photo as banner
- [ ] Implement photo deletion from storage (not just from UI)
