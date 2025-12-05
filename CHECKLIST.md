# Bonded App Development Checklist

**Bonded is a social networking platform for college students (think YikYak and Series meets Instagram) - a closed campus-only social network designed to help college students form meaningful connections through AI personality modeling, vibe-based discovery, and anonymous compatibility matching.**

---

## Phase 1: Foundation & Setup

### Supabase Setup
- [x] Install Supabase client (`@supabase/supabase-js`)
- [x] Configure Supabase client
- [x] Set up environment variables
- [ ] Test connection

### State Management
- [ ] Install Zustand + React Query
- [ ] Set up React Query provider
- [ ] Create auth store (Zustand)
- [ ] Create auth context/hooks
- [ ] Create profile store
- [ ] Create yearbook store
- [ ] Create scrapbook store
- [ ] Create quad store
- [ ] Create link (AI) store

### Database Setup
- [ ] Create users table
  - [ ] Core fields (id, email, is_verified, etc.)
  - [ ] Campus assignment fields
  - [ ] Profile status fields
  - [ ] Love Print readiness fields
- [ ] Create profiles table
  - [ ] Photos (2-3)
  - [ ] Tags (personality, humor, aesthetic, interests)
  - [ ] Vibe line/quote
  - [ ] Social links
  - [ ] Activity status
- [ ] Create campus table
  - [ ] Campus domains
  - [ ] Campus names
  - [ ] Silo isolation
- [ ] Create love_prints table (AI personality model)
- [ ] Create matches table
- [ ] Create messages table
- [ ] Create voice_notes table
- [ ] Create quad_posts table
- [ ] Create ratings table (anonymous Scrapbook ratings)
- [ ] Set up Row Level Security (RLS) for all tables
- [ ] Create auth trigger (auto-create user on signup)
- [ ] Add verification fields (.edu check, countdown)
- [ ] Set up campus isolation policies

---

## Phase 2: Welcome Screen

- [x] Custom button
- [x] Logo (animated)
- [x] Gradient background
- [ ] Explains Bonded (add description text)

---

## Phase 3: Login & Signup Screen

### UI Components
- [ ] Back button
- [ ] Icons (email, password, etc.)
- [ ] Email input field
- [ ] OTP input component
- [ ] Link mascot integration

### Email Entry
- [ ] Email validation
- [ ] Campus domain detection
- [ ] .edu email check

### OTP Flow
- [ ] Send OTP
- [ ] OTP input component
- [ ] Verify OTP
- [ ] Resend OTP functionality

### Account Check Logic
- [ ] Check if email exists in database
- [ ] New user flow
- [ ] Returning user flow
- [ ] Welcome back screen
- [ ] Create account screen
- [ ] Error handling

### Campus Assignment
- [ ] Auto-assign campus from email domain
- [ ] Campus verification
- [ ] Campus silo enforcement

---

## Phase 4: .edu Verification

- [ ] .edu email input
- [ ] Domain validation
- [ ] Verification countdown logic
- [ ] Expiration handling
- [ ] Warning messages
- [ ] Force verification flow

---

## Phase 5: Onboarding

### Structure
- [ ] Onboarding flow router
- [ ] Progress indicator
- [ ] Step navigation

### Step 1: Welcome
- [ ] Welcome screen with Link mascot
- [ ] "Let's set up your profile" message

### Step 2: Photos
- [ ] Photo upload (2-3 photos)
- [ ] Image compression
- [ ] EXIF removal
- [ ] Supabase Storage integration

### Step 3: Basic Info
- [ ] Name input
- [ ] Age input
- [ ] School year selector
- [ ] Major input
- [ ] Pronouns selector

### Step 4: Interests
- [ ] Interest selection (minimum 5)
- [ ] Tag system
- [ ] Personality tags
- [ ] Humor style tags
- [ ] Aesthetic tags

### Step 5: Personality Quiz
- [ ] Vibe-based questions
- [ ] Social energy assessment
- [ ] Weekend style questions
- [ ] Friendship style questions
- [ ] Store results for Love Print

### Step 6: Matching Preferences
- [ ] Friends toggle
- [ ] Study partners toggle
- [ ] Roommates toggle
- [ ] Co-founders toggle
- [ ] Campus radius setting

### Step 7: Bond Profile Loading
- [ ] Mascot animation (Link)
- [ ] "Finding your people..." message
- [ ] Profile generation
- [ ] Love Print initialization

### Step 8: Onboarding Complete
- [ ] Success screen
- [ ] Navigate to Home (Yearbook)

---

## Phase 6: The Yearbook (Home Screen)

### Core Features
- [ ] Instagram-style grid layout
- [ ] Profile card component
- [ ] Layered Swiper carousel effect
- [ ] Profile glow (activity status)
- [ ] Infinite scroll

### Profile Cards
- [ ] Name + pronouns display
- [ ] Tags display (personality, humor, aesthetic, interests)
- [ ] Mini quote/vibe line
- [ ] Shared traits/Bonded insights
- [ ] Social links (toggleable)
- [ ] Full profile view

### Filtering & Sorting
- [ ] Filter by major
- [ ] Filter by interests
- [ ] Filter by personality type
- [ ] Filter by class year
- [ ] Filter by clubs
- [ ] Sort options

### Navigation
- [ ] Yearbook tab (default)
- [ ] Quad tab
- [ ] Scrapbook tab (locked until unlocked)
- [ ] Profile tab

---

## Phase 7: The Quad (Campus Forum)

### Core Features
- [ ] Forum post list
- [ ] Post creation
- [ ] Post categories
- [ ] Comments system
- [ ] Upvote/downvote
- [ ] Campus-only access

### Post Types
- [ ] Study requests
- [ ] Event announcements
- [ ] Club posts
- [ ] Lost & found
- [ ] General discussions
- [ ] Vibe-based conversations

### UI
- [ ] Reddit-style layout
- [ ] Thread view
- [ ] Comment nesting
- [ ] Search functionality

---

## Phase 8: The Scrapbook (Love Mode)

### Unlock System
- [ ] Unlock screen
- [ ] Preference settings
  - [ ] Attraction preferences
  - [ ] Looking for options
  - [ ] Comfort level
  - [ ] Dealbreakers
- [ ] Access granted confirmation

### Rating System
- [ ] Profile grid (Scrapbook view)
- [ ] 1-10 rating interface
- [ ] Anonymous rating (no one sees)
- [ ] Rating storage
- [ ] AI training data collection

### Love Print Building
- [ ] AI personality model
- [ ] Daily emotional questions
- [ ] Activity pattern analysis
- [ ] Conversation tone analysis
- [ ] Dynamic Love Print updates
- [ ] Compatibility scoring

### Anonymous Matching
- [ ] AI matching algorithm
- [ ] Attraction alignment check
- [ ] Love Print overlap analysis
- [ ] Communication style compatibility
- [ ] Emotional pace matching
- [ ] Values alignment
- [ ] Match notification system

### Bonded Stages
- [ ] Stage 1: Text (Blind)
  - [ ] No names/photos/bios
  - [ ] Link-guided prompts
  - [ ] Conversation quality check
- [ ] Stage 2: Voice
  - [ ] Voice note interface
  - [ ] Voice transcription
  - [ ] Tone/emotion analysis
- [ ] Stage 3: Profile Reveal
  - [ ] Full profile reveal
  - [ ] Compatibility score
  - [ ] Full chat access

---

## Phase 9: Link (AI Agent)

### Connection Features
- [ ] "Find me someone who..." queries
- [ ] Personality checking
- [ ] Interest matching
- [ ] Skills matching
- [ ] Availability checking
- [ ] Interaction graph analysis
- [ ] Curated intro generation
- [ ] Match recommendations

### Message Moderation
- [ ] Hate speech detection
- [ ] Threat detection
- [ ] Harassment screening
- [ ] Sexual content filtering
- [ ] Underage protection
- [ ] Message caching system
- [ ] Similarity comparison
- [ ] Cost-optimized AI calls

### Conversation Assistance
- [ ] Conversation pacing
- [ ] Red flag detection
- [ ] Emotional safety checks
- [ ] Link prompts and guidance

---

## Phase 10: Messaging System

### Core Messaging
- [ ] Real-time messaging (Supabase Realtime)
- [ ] Message storage
- [ ] RLS policies for privacy
- [ ] Campus isolation
- [ ] Message threading

### Voice Notes
- [ ] Voice recording interface
- [ ] Audio compression
- [ ] Whisper/Google STT transcription
- [ ] Audio playback
- [ ] Text storage for AI checks
- [ ] Audio storage

### Media Handling
- [ ] Photo sharing
- [ ] Image compression
- [ ] CDN integration
- [ ] EXIF removal
- [ ] Secure storage (Supabase Storage)

---

## Phase 11: Profile Management

### Profile Editing
- [ ] Edit photos
- [ ] Update tags
- [ ] Edit vibe line
- [ ] Update social links
- [ ] Privacy settings

### Activity Status
- [ ] Online/away/offline status
- [ ] Profile glow updates
- [ ] Last active tracking

---

## Phase 12: Safety & Privacy

### Campus Verification
- [ ] .edu email verification
- [ ] Phone number verification
- [ ] Campus assignment
- [ ] Cross-campus prevention

### Privacy Features
- [ ] Anonymous rating system
- [ ] Profile visibility controls
- [ ] Social link toggles
- [ ] Block/report functionality

### AI Safety
- [ ] Message moderation pipeline
- [ ] Content filtering
- [ ] User reporting system
- [ ] Admin tools

---

## Phase 13: Performance & Optimization

- [ ] Image optimization
- [ ] CDN setup
- [ ] Caching strategies
- [ ] API cost optimization
- [ ] Real-time subscription management
- [ ] Database query optimization
- [ ] RLS policy optimization

---

## Phase 14: Testing & Launch

- [ ] Unit tests
- [ ] Integration tests
- [ ] E2E tests
- [ ] Security audit
- [ ] Performance testing
- [ ] Beta testing
- [ ] Launch preparation

