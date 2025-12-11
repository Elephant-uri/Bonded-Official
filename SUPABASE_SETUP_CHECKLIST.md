# Supabase Setup & Integration Checklist

**Complete guide for setting up Supabase, integrating it with the Bonded app, and seeding initial data so new users see content when they onboard.**

---

## Phase 1: Supabase Project Setup

### 1.1 Create Supabase Project
- [ ] Go to https://supabase.com and sign up/login
- [ ] Click "New Project"
- [ ] Fill in project details:
    - [ ] Project name: `bonded-app` (or your choice)
    - [ ] Database password: Generate strong password (save it!)
    - [ ] Region: Choose closest to your users
    - [ ] Pricing plan: Free tier is fine for development
- [ ] Wait for project to be created (2-3 minutes)

### 1.2 Get API Credentials
- [ ] Go to Project Settings → API
- [ ] Copy the following:
    - [ ] **Project URL** (e.g., `https://xxxxx.supabase.co`)
    - [ ] **anon/public key** (starts with `eyJ...`)
    - [ ] **service_role key** (keep secret! Only for server-side)
- [ ] Save these credentials securely

### 1.3 Configure Environment Variables
- [ ] Create `.env` file in project root (`/Users/isaacgbaba/Bonded-Official/.env`)
- [ ] Add the following variables:
    ```
    EXPO_PUBLIC_SUPABASE_URL=https://your-project.supabase.co
    EXPO_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
    EXPO_PUBLIC_UNSPLASH_ACCESS_KEY=your-unsplash-key-here
    ```
- [ ] Verify `.env` is in `.gitignore` (don't commit secrets!)
- [ ] Restart dev server: `npx expo start --clear`

---

## Phase 2: Database Schema Setup

### 2.1 Core Tables Setup
- [ ] Open Supabase SQL Editor
- [ ] Run `database/setup.sql` to create:
    - [ ] `profiles` table with all required fields
    - [ ] `universities` table
    - [ ] Auth trigger function (`handle_new_user`)
    - [ ] Row Level Security (RLS) policies

### 2.2 Forum/Posts Tables
- [ ] Run `database/forum-features-schema.sql` to create:
    - [ ] `forums` table (campus forums, class forums, etc.)
    - [ ] `posts` table (forum posts)
    - [ ] `post_tags` table (tag associations)
    - [ ] `post_reactions` table (likes, upvotes, etc.)
    - [ ] `comments` table (post comments)
    - [ ] `comment_reactions` table
    - [ ] `reposts` table
    - [ ] `poll_options` and `poll_votes` tables
    - [ ] RLS policies for all tables

### 2.3 Events Tables
- [ ] Run `database/events-schema.sql` to create:
    - [ ] `events` table
    - [ ] `event_attendees` table
    - [ ] `event_invites` table
    - [ ] RLS policies

### 2.4 Onboarding Tables
- [ ] Run `database/onboarding-schema.sql` to create:
    - [ ] `onboarding_responses` table
    - [ ] `user_interests` table
    - [ ] `user_schedule` table
    - [ ] RLS policies

### 2.5 Class Schedule Tables (CRITICAL for Class Organization)
- [ ] Run `database/class-schedule-schema.sql` to create:
    - [ ] `classes` table (master list of all classes by university)
        - [ ] Class code, name, department, credits
        - [ ] University association
        - [ ] Unique constraint on university + class code
    - [ ] `class_sections` table (specific sections/instances)
        - [ ] Section number, professor, semester
        - [ ] Days of week, time, location
        - [ ] Enrollment capacity
    - [ ] `user_class_enrollments` table (users enrolled in classes)
        - [ ] Links users to classes/sections
        - [ ] Tracks semester, enrollment type
        - [ ] Active vs past enrollments
    - [ ] Auto-create forum function (`ensure_class_forum`)
    - [ ] Trigger to create forums when class gets first enrollment
    - [ ] `find_classmates()` function (finds users in same classes)
    - [ ] RLS policies for all class tables
    - [ ] Update `forums` table to support `class_id` foreign key
    - [ ] RLS policy for class forums (enrolled students only)

### 2.6 Stories Tables
- [ ] Create `stories` table:
    - [ ] Table structure with all required fields
    - [ ] Foreign keys to `users` and `forums`
    - [ ] Expiration timestamp field
    - [ ] Media type field (image/video)
    - [ ] Text and sticker elements (JSONB)
- [ ] Set up RLS policies:
    - [ ] Users can view stories from their campus
    - [ ] Users can create their own stories
    - [ ] Users can delete their own stories

### 2.7 Verify Tables
- [ ] Go to Table Editor in Supabase dashboard
- [ ] Verify all tables exist:
    - [ ] `profiles`
    - [ ] `universities`
    - [ ] `forums`
    - [ ] `posts`
    - [ ] `post_tags`
    - [ ] `post_reactions`
    - [ ] `comments`
    - [ ] `events`
    - [ ] `event_attendees`
    - [ ] `stories`
    - [ ] `onboarding_responses`

---

## Phase 3: Seed Initial Data

### 3.1 Seed Universities
- [ ] Create SQL script to insert universities
- [ ] Include at least:
    - [ ] University of Rhode Island (uri.edu)
    - [ ] Brown University (brown.edu)
    - [ ] Rhode Island College (ric.edu)
- [ ] Run in SQL Editor

### 3.2 Seed Classes (For Schedule Matching)
- [ ] Create seed script for classes:
    - [ ] Seed common classes for each university
    - [ ] Include class codes, names, departments
    - [ ] Examples: CS 201, ENGL 101, MATH 150, etc.
- [ ] Run in SQL Editor
- [ ] Note: Class forums will be auto-created when users enroll

### 3.3 Seed Forums
- [ ] Create seed script for forums
- [ ] Create forums for each university:
    - [ ] Main Forum
    - [ ] Campus Events
    - [ ] Clubs & Organizations
    - [ ] Housing & Roommates
    - [ ] Academic
- [ ] Note: Class forums are created automatically via trigger
- [ ] Run in SQL Editor

### 3.4 Create Seed User Account
- [ ] Create a test admin user via Supabase Auth
- [ ] Or use Supabase dashboard → Authentication → Add user
- [ ] Verify user is created and has profile

### 3.5 Seed Posts (CRITICAL - For Empty App Prevention)
- [ ] Run `database/seed-data.sql` script
- [ ] Verify posts are created for each forum
- [ ] Verify posts have realistic timestamps
- [ ] Test that new users see these posts

### 3.5 Create Seeded Posts Function
- [ ] Create function that auto-creates seed posts for new forums
- [ ] Function should check if forum has posts
- [ ] Create welcome post if forum is empty
- [ ] Test function execution

---

## Phase 4: Storage Setup (For Images/Media)

### 4.1 Create Storage Buckets
- [ ] Go to Storage in Supabase dashboard
- [ ] Create buckets:
    - [ ] `profile-photos` (public, with RLS)
    - [ ] `post-media` (public, with RLS)
    - [ ] `story-media` (public, with RLS)
    - [ ] `event-covers` (public, with RLS)

### 4.2 Set Storage Policies
- [ ] For each bucket, add policies:
    - [ ] Users can upload their own media
    - [ ] Anyone can view public media
    - [ ] Users can update their own media
    - [ ] Users can delete their own media
- [ ] Test upload permissions
- [ ] Test view permissions

---

## Phase 5: Authentication Integration

### 5.1 Update Supabase Client
- [ ] Verify `lib/supabase.js` has correct configuration
- [ ] Test connection in `app/index.jsx`
- [ ] Ensure AsyncStorage is properly configured

### 5.2 Auth Flow Implementation
- [ ] Verify `hooks/useSendOTP.js` works
- [ ] Verify `hooks/useVerifyOTP.js` works
- [ ] Verify `hooks/useCheckEmail.js` works
- [ ] Test full auth flow:
    - [ ] Enter email → Send OTP
    - [ ] Enter OTP → Verify
    - [ ] Check if profile is created automatically
    - [ ] Check if user is redirected correctly

### 5.3 Session Management
- [ ] Verify `stores/authStore.js` persists session
- [ ] Test app restart (session should persist)
- [ ] Test logout functionality
- [ ] Test session refresh

---

## Phase 6: Data Fetching Integration

### 6.1 Replace Mock Data with Supabase Queries

#### 6.1.1 Forum Posts
- [ ] Create `hooks/useForumPosts.js`
- [ ] Implement query with proper joins
- [ ] Include user profiles, reactions, comments
- [ ] Replace mock data in `app/forum.jsx` with this hook
- [ ] Test loading states
- [ ] Test error handling

#### 6.1.2 Events
- [ ] Update `hooks/events/useEventsForUser.js` to use Supabase
- [ ] Replace mock data in `app/events/index.jsx`
- [ ] Test event loading
- [ ] Test event filtering

#### 6.1.3 Stories
- [ ] Create `hooks/useStories.js`
- [ ] Implement query with user profiles
- [ ] Filter expired stories
- [ ] Update `contexts/StoriesContext.jsx` to use Supabase
- [ ] Test story loading

#### 6.1.4 Yearbook/Profiles
- [ ] Create `hooks/useYearbookProfiles.js`
- [ ] Implement query with university filtering
- [ ] Filter by yearbook visibility
- [ ] Replace mock data in `app/yearbook.jsx`
- [ ] Test profile loading

#### 6.1.5 Class Schedule & Classmates
- [ ] Create `hooks/useUserClasses.js`:
    - [ ] Fetch user's enrolled classes
    - [ ] Include class details and sections
    - [ ] Filter by active enrollments
    - [ ] Group by semester
- [ ] Create `hooks/useClassmates.js`:
    - [ ] Use `find_classmates()` database function
    - [ ] Find users in same classes
    - [ ] Show shared classes count
    - [ ] Filter by current semester
- [ ] Create `hooks/useClassForum.js`:
    - [ ] Get forum for a specific class
    - [ ] Auto-create if doesn't exist
    - [ ] Verify user has access (enrolled)
- [ ] Create `hooks/useClassesByUniversity.js`:
    - [ ] Search classes by code/name
    - [ ] Filter by department
    - [ ] For class selection during schedule upload

### 6.2 Mutations (Create/Update/Delete)

#### 6.2.1 Create Post
- [ ] Create `hooks/useCreatePost.js`
- [ ] Implement mutation with proper error handling
- [ ] Invalidate queries on success
- [ ] Update `app/forum.jsx` create post handler
- [ ] Test post creation

#### 6.2.2 Create Story
- [ ] Create `hooks/useCreateStory.js`
- [ ] Implement mutation
- [ ] Handle media upload
- [ ] Update `contexts/StoriesContext.jsx`
- [ ] Test story creation

#### 6.2.3 React to Post
- [ ] Create `hooks/useReactToPost.js`
- [ ] Implement upsert logic
- [ ] Handle like/unlike
- [ ] Update post reaction handlers
- [ ] Test reactions

#### 6.2.4 Enroll in Class
- [ ] Create `hooks/useEnrollInClass.js`:
    - [ ] Insert into `user_class_enrollments`
    - [ ] Auto-create class forum if needed
    - [ ] Update enrollment counts
    - [ ] Invalidate class-related queries
- [ ] Create `hooks/useUnenrollFromClass.js`:
    - [ ] Mark enrollment as inactive
    - [ ] Handle forum access removal
- [ ] Test enrollment flow

---

## Phase 7: Onboarding Flow Integration

### 7.1 Save Onboarding Data
- [ ] Verify `hooks/useSaveOnboarding.js` saves to Supabase
- [ ] Test each onboarding step saves correctly
- [ ] Verify profile is updated after onboarding
- [ ] Test data persistence

### 7.3 Save Class Schedule
- [ ] Create `hooks/useSaveClassSchedule.js`:
    - [ ] Parse uploaded schedule (iCal, CSV, or manual entry)
    - [ ] Extract class information (code, name, professor, time, location)
    - [ ] Match classes to `classes` table (or create new entries)
    - [ ] Create `class_sections` if needed
    - [ ] Insert into `user_class_enrollments` table
    - [ ] Update `profiles.class_schedule` JSONB for quick access
    - [ ] Auto-create class forums via trigger
- [ ] Update `components/onboarding/steps/ClassScheduleStep.jsx`:
    - [ ] Add schedule upload (iCal file picker)
    - [ ] Add manual class entry option
    - [ ] Display parsed classes for confirmation
    - [ ] Save schedule on continue
- [ ] Test schedule upload and parsing
- [ ] Verify enrollments are created
- [ ] Verify class forums are auto-created

### 7.4 Check Onboarding Status
- [ ] Add check in app startup
- [ ] Query profile for `onboarding_complete` status
- [ ] Redirect to onboarding if not complete
- [ ] Test redirect logic

---

## Phase 8: Class Schedule Features

### 8.1 Schedule Upload & Parsing
- [ ] Implement iCal file parser:
    - [ ] Parse .ics files
    - [ ] Extract class information
    - [ ] Handle recurring events
    - [ ] Extract time, location, professor
- [ ] Implement CSV parser (alternative):
    - [ ] Parse CSV schedule exports
    - [ ] Map columns to class fields
- [ ] Implement manual entry:
    - [ ] Form for adding classes manually
    - [ ] Class code, name, professor, time, location
    - [ ] Days of week selector
    - [ ] Semester selector

### 8.2 Class Matching & Organization
- [ ] Create class matching logic:
    - [ ] Match parsed classes to existing `classes` table
    - [ ] Fuzzy matching for class codes
    - [ ] Create new class entries if not found
    - [ ] Handle variations in naming
- [ ] Create section matching:
    - [ ] Match to existing `class_sections`
    - [ ] Create new section if needed
    - [ ] Update enrollment counts

### 8.3 Classmate Discovery
- [ ] Create "My Classes" screen:
    - [ ] Display user's enrolled classes
    - [ ] Show classmates count per class
    - [ ] Link to class forum
    - [ ] Link to classmates list
- [ ] Create "Classmates" screen:
    - [ ] Show users in same classes
    - [ ] Highlight shared classes
    - [ ] Filter by class or semester
    - [ ] Link to profiles
- [ ] Create "Find Study Partners" feature:
    - [ ] Filter by shared classes
    - [ ] Filter by study habits compatibility
    - [ ] Show compatibility score

### 8.4 Class Forums Integration
- [ ] Auto-create forums when class gets first enrollment
- [ ] Verify forum access (enrolled students only)
- [ ] Display class forums in sidebar under "Your classes"
- [ ] Show unread post counts
- [ ] Link class forums to class detail pages

### 8.5 Schedule Display
- [ ] Create weekly schedule view:
    - [ ] Calendar grid layout
    - [ ] Show classes by day/time
    - [ ] Color code by class
    - [ ] Show location and professor
- [ ] Create list view:
    - [ ] List all enrolled classes
    - [ ] Group by semester
    - [ ] Show class details
    - [ ] Quick actions (forum, classmates)

---

## Phase 9: Seeded Content for New Users

### 9.1 Auto-Create Welcome Posts
- [ ] Create database function that runs when forum is created
- [ ] Function should create welcome post automatically
- [ ] Test function execution

### 9.2 Application-Level Seeding
- [ ] Create `services/seedService.js`
- [ ] Implement `ensureSeededContent(forumId)` function
- [ ] Check if forum has posts
- [ ] Create welcome post if empty
- [ ] Call function when user first opens a forum
- [ ] Test seeding logic

### 9.3 Seed Multiple Posts Per Forum
- [ ] Create comprehensive seed script
- [ ] Include variety of post types
- [ ] Use realistic timestamps (spread over days)
- [ ] Run seed script after creating users
- [ ] Verify posts appear for new users

### 9.4 Seed Stories
- [ ] Create seed stories script (optional, for testing)
- [ ] Seed stories with varied expiration times
- [ ] Test story display
- [ ] Verify expired stories are filtered

---

## Phase 10: Real-time Subscriptions (Optional but Recommended)

### 10.1 Post Updates
- [ ] Add real-time subscription in `app/forum.jsx`
- [ ] Subscribe to post changes
- [ ] Invalidate queries on updates
- [ ] Test real-time updates

### 10.2 Story Updates
- [ ] Add real-time for stories
- [ ] Subscribe to story changes
- [ ] Update UI on new stories
- [ ] Test real-time functionality

### 10.3 Comment Updates
- [ ] Add real-time for comments
- [ ] Subscribe to comment changes
- [ ] Update comment counts
- [ ] Test real-time comments

---

## Phase 11: Testing & Verification

### 11.1 Test Authentication
- [ ] Test new user signup
- [ ] Test existing user login
- [ ] Test OTP verification
- [ ] Test session persistence
- [ ] Test logout

### 11.2 Test Data Fetching
- [ ] Verify posts load from Supabase
- [ ] Verify events load from Supabase
- [ ] Verify stories load from Supabase
- [ ] Verify profiles load from Supabase
- [ ] Test loading states
- [ ] Test error states

### 11.3 Test Data Creation
- [ ] Test creating a post
- [ ] Test creating a story
- [ ] Test creating an event
- [ ] Test commenting on a post
- [ ] Test reacting to a post
- [ ] Verify data appears in database

### 11.4 Test Seeded Content
- [ ] Create a new test user
- [ ] Verify they see seeded posts
- [ ] Verify forums are not empty
- [ ] Verify welcome posts appear
- [ ] Test with multiple new users

### 11.5 Test Class Schedule Features
- [ ] Test schedule upload (iCal file)
- [ ] Test schedule parsing
- [ ] Test class matching
- [ ] Test enrollment creation
- [ ] Test class forum auto-creation
- [ ] Test classmate discovery
- [ ] Test "My Classes" display
- [ ] Test class forum access
- [ ] Test with multiple users in same class
- [ ] Verify classmates can see each other

### 11.6 Test RLS Policies
- [ ] Verify users can only see their campus data
- [ ] Verify users can only edit their own posts
- [ ] Verify anonymous posts hide user identity
- [ ] Test with multiple users from different campuses
- [ ] Test cross-campus isolation

---

## Phase 12: Production Readiness

### 12.1 Environment Variables
- [ ] Move to production Supabase project
- [ ] Update `.env` with production credentials
- [ ] Set up environment-specific configs
- [ ] Verify production connection

### 12.2 Database Backups
- [ ] Set up automated backups in Supabase
- [ ] Document backup restoration process
- [ ] Test backup restoration
- [ ] Set backup retention policy

### 12.3 Monitoring
- [ ] Set up Supabase dashboard monitoring
- [ ] Set up error tracking (Sentry, etc.)
- [ ] Monitor API usage and limits
- [ ] Set up alerts for errors

### 12.4 Performance Optimization
- [ ] Add database indexes:
    - [ ] Index on `posts(forum_id, created_at DESC)`
    - [ ] Index on `posts(user_id)`
    - [ ] Index on `stories(forum_id, expires_at)`
    - [ ] Index on `profiles(university_id)`
- [ ] Optimize queries (use select specific columns)
- [ ] Implement pagination for large lists
- [ ] Test query performance

---

## Phase 13: Documentation

### 13.1 API Documentation
- [ ] Document all Supabase tables and relationships
- [ ] Document RLS policies
- [ ] Document custom functions
- [ ] Create ER diagram

### 13.2 Setup Documentation
- [ ] Document environment variable setup
- [ ] Document database migration process
- [ ] Document seeding process
- [ ] Create setup guide for new developers

### 13.3 Troubleshooting Guide
- [ ] Common errors and solutions
- [ ] How to reset database
- [ ] How to reseed data
- [ ] How to debug RLS issues
- [ ] How to check connection issues

---

## Quick Reference: Key SQL Scripts to Run

- [ ] **Initial Setup**: `database/setup.sql`
- [ ] **Forum Schema**: `database/forum-features-schema.sql`
- [ ] **Events Schema**: `database/events-schema.sql`
- [ ] **Onboarding Schema**: `database/onboarding-schema.sql`
- [ ] **Class Schedule Schema**: `database/class-schedule-schema.sql` (CRITICAL for class organization)
- [ ] **Seed Data**: `database/seed-data.sql`
- [ ] **Stories Table**: (Create custom script - see Phase 2.6)

---

## Important Notes

- **Always test RLS policies** - They're critical for data security
- **Seed data should be created AFTER users exist** - Posts need valid user_ids
- **Use transactions** for complex seed operations
- **Backup before major changes** - Supabase has point-in-time recovery
- **Monitor API usage** - Free tier has limits
- **Test with multiple users** - Ensure campus isolation works
- **Verify seeded content appears** - Critical for preventing empty app experience

---

## Getting Help

- Supabase Docs: https://supabase.com/docs
- Supabase Discord: https://discord.supabase.com
- Check existing SQL files in `/database` folder
- Review existing hooks in `/hooks` folder for patterns
