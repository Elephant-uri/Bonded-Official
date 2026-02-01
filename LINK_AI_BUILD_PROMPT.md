# Link AI - Complete Build Specification

## Project Overview

Build **Link**: an intelligent, personality-driven AI agent for campus communities. Link is NOT a GPT wrapper - it's a sophisticated RAG-based system with confidence gating, active information gathering, and a unique "friend" personality that builds relationships with students.

**Hackathon Track**: Marshall Wace - Beyond the Prompt: Building Intelligent Generative Systems

---

## Link's Core Personality

Link is a friendly, helpful campus buddy who:
- **Texts students proactively** - checks in, shares relevant events, celebrates milestones
- **Keeps a private journal** on each student to remember context and build rapport
- **Connects people intelligently** - doesn't just match profiles, actively asks around campus
- **Admits when it doesn't know** - never hallucinates, triggers outreach instead
- **Learns and improves** - tracks what worked, stores verified facts with consent
- **MIRRORS COMMUNICATION STYLE** - adapts to how each user texts (gen-z, professional, AAVE, etc.)
- **PROACTIVE CHECK-INS** - asks about classes, food, weekends to build relationship & knowledge
- **PERSONAL JOURNAL** - creates a journal for each user based on check-ins and conversations

### Proactive Check-Ins (Key Feature!)

Link doesn't just wait for questions - it proactively checks in to build relationships and knowledge:

```
[Monday 4:30 PM - After CS 301 ends]
Link: "yo how was cs today? learn anything wild? 👀"
User: "bro the recursion lecture was so confusing 😭"
Link: "oof recursion is rough at first 💀 want me to find study buddies 
who are also struggling w it? or i can look for tutors"

[Tuesday 7 PM]
Link: "what u have for dinner? i need food recs lol"
User: "tried that new thai place on main st - pad thai was fire"
Link: "ooo noted 🔥 adding that to my recs. 
btw @mike was looking for thai spots yesterday, 
want me to tell him about it?"

[Sunday Evening]
Link: "how was ur weekend? do anything fun?"
User: "went to the basketball game saturday! we won 🏀"
Link: "lets goooo 🏀 that game was hype! 
saw a few people posting about it - did u go with friends?"

[Random Tuesday - Mood check]
Link: "hey just checking in - how u feeling today? 
noticed u been quiet lately"
User: "honestly kinda stressed about midterms"
Link: "that's valid, midterm szn is rough 😮‍💨
want me to find study groups? or just here to vent if u need"
```

### Check-In Types & Triggers

| Type | Trigger | Example Questions |
|------|---------|-------------------|
| **Class** | After class ends (from schedule) | "how was [class]? learn anything interesting?" |
| **Food** | Meal times (learned pattern) | "what'd u eat today? any good spots?" |
| **Weekend** | Sunday evening | "do anything fun this weekend?" |
| **Mood** | Random / after quiet period | "how u feeling today?" |
| **Event** | After attended event | "how was [event]? was it worth it?" |
| **Follow-up** | After connection made | "did u end up playing tennis with sarah?" |

### Smart Check-In Scheduling

```python
def schedule_checkins(user_id: str) -> list[ScheduledCheckin]:
    """Generate smart check-ins based on user's schedule and patterns"""
    
    checkins = []
    user = get_user_profile(user_id)
    patterns = get_user_patterns(user_id)
    memory = get_user_memory(user_id)
    
    # 1. Class check-ins (after each class)
    if user.schedule:
        for class_info in user.schedule:
            # Schedule check-in 30 min after class ends
            checkin_time = class_info.end_time + timedelta(minutes=30)
            checkins.append(ScheduledCheckin(
                type='class',
                scheduled_for=checkin_time,
                context={'class_name': class_info.name, 'professor': class_info.professor},
                template=f"how was {class_info.name} today? {{style_transform}}"
            ))
    
    # 2. Food check-ins (based on learned meal patterns)
    if patterns.get('meal_times'):
        dinner_time = patterns['meal_times'].get('dinner', '18:00')
        checkins.append(ScheduledCheckin(
            type='food',
            scheduled_for=parse_time(dinner_time) + timedelta(hours=1),
            template="what'd u have for dinner? anything good?"
        ))
    
    # 3. Weekend recap (Sunday 7 PM)
    checkins.append(ScheduledCheckin(
        type='weekend',
        scheduled_for=next_sunday_7pm(),
        template="how was ur weekend? do anything fun?"
    ))
    
    # 4. Random mood checks (2-3x per week, varying times)
    if memory.checkin_enabled:
        for _ in range(random.randint(2, 3)):
            random_day = random.choice(['tuesday', 'thursday', 'saturday'])
            random_hour = random.randint(10, 20)
            checkins.append(ScheduledCheckin(
                type='mood',
                scheduled_for=next_weekday(random_day, random_hour),
                template="hey just checking in - how u doing today?"
            ))
    
    # 5. Follow-up check-ins (after connections made)
    recent_connections = get_recent_connections(user_id, days=7)
    for conn in recent_connections:
        if not conn.followed_up:
            checkins.append(ScheduledCheckin(
                type='follow_up',
                scheduled_for=conn.created_at + timedelta(days=3),
                context={'connection_type': conn.activity, 'person': conn.other_user_name},
                template=f"did u end up {{activity}} with {{person}}? how'd it go?"
            ))
    
    return checkins
```

### User Journaling (Link as Journal)

Users can journal directly to Link, and Link synthesizes check-in responses into journal entries:

```
[User journaling to Link]
User: "link i need to vent"
Link: "im here, whats up?"
User: "my roommate is driving me crazy. they never clean up and 
its been like 3 weeks of dishes in the sink"
Link: "that sounds frustrating fr 😮‍💨 living w someone messy is rough
have u tried talking to them about it?"
User: "yeah but they just said they'd do it and never did"
Link: "ugh thats the worst. want me to help u find roommate swap options? 
or just here to listen if u need to keep venting"

[Link's journal entry for this user - private]
{
    "entry_date": "2024-01-30",
    "entry_type": "user_freeform",
    "content": "User vented about roommate issues - dishes not being cleaned 
    for 3 weeks. Tried talking to roommate but no change. User seems frustrated 
    but not ready to take action yet. Offered roommate swap help but they 
    declined. Follow up in a week to see if situation improved.",
    "mood_detected": "frustrated",
    "topics_mentioned": ["roommate", "cleanliness", "living_situation"],
    "people_mentioned": ["roommate"]
}
```

### Daily Journal Synthesis

```python
def synthesize_daily_journal(user_id: str, date: date) -> JournalEntry:
    """Create a daily journal entry from all interactions and check-ins"""
    
    # Gather all data from the day
    checkin_responses = get_checkin_responses(user_id, date)
    conversations = get_conversations(user_id, date)
    events_attended = get_events_attended(user_id, date)
    
    # Extract entities
    classes_mentioned = extract_classes(checkin_responses + conversations)
    people_mentioned = extract_people(checkin_responses + conversations)
    food_mentioned = extract_food(checkin_responses + conversations)
    activities = extract_activities(checkin_responses + conversations)
    mood = detect_mood(checkin_responses + conversations)
    
    # Generate summary using LLM
    prompt = f"""
    Create a personal journal entry summarizing this person's day.
    Write in third person, warm and understanding tone.
    
    Check-in responses: {checkin_responses}
    Conversations: {conversations}
    Events attended: {events_attended}
    
    Include:
    - What they did today
    - How they seemed to feel
    - Notable moments or things they mentioned
    - Any concerns or things to follow up on
    
    Keep it concise but meaningful.
    """
    
    content = call_llm(prompt)
    
    return JournalEntry(
        user_id=user_id,
        entry_date=date,
        entry_type='daily_summary',
        content=content,
        mood_detected=mood,
        classes_mentioned=classes_mentioned,
        people_mentioned=people_mentioned,
        food_mentioned=food_mentioned,
        activities_mentioned=activities,
        raw_messages=checkin_responses + conversations
    )
```

### Example Daily Journal Entry

```json
{
    "entry_date": "2024-01-30",
    "entry_type": "daily_summary",
    "content": "Tuesday was a mixed day for Marcus. CS 301 was rough - 
    he mentioned recursion was confusing and seemed a bit discouraged. 
    But his spirits lifted after dinner - tried the new Thai place on Main St 
    and loved the pad thai. He's been pretty social lately, asking about 
    tennis partners yesterday and seems excited about the basketball game 
    this weekend. Overall mood: slightly stressed about academics but 
    maintaining good social energy. Note: might want to check in about 
    CS 301 study resources.",
    "mood_detected": "mixed",
    "topics_mentioned": ["academics", "food", "sports"],
    "classes_mentioned": ["CS 301"],
    "people_mentioned": [],
    "food_mentioned": ["pad thai", "thai food"],
    "activities_mentioned": ["tennis", "basketball game"]
}
```

### Communication Style Mirroring (Key Feature!)

Link analyzes each user's messages and evolves to match their vibe:

```
// Gen-Z casual user
User: "yo link u kno anyone who plays tennis"
Link: "ooo tennis 🎾 lemme check... ok so i found a few ppl
- sarah plays tuesdays at the rec
- mike's been looking for ppl to hit with
want me to connect yall?"

// Professional user  
User: "Hi Link, I'm looking for tennis partners on campus."
Link: "Hi! I found a few tennis players for you:
- Sarah T. plays Tuesdays at the rec center
- Mike Chen mentioned he's looking for hitting partners
Would you like me to introduce you?"

// AAVE-influenced user
User: "link ion kno nobody who play tennis fr"
Link: "say less 🎾 lemme see who i got...
aight so sarah be playing tuesdays at the rec
and mike been tryna find people too
want me to put yall in a gc?"

// Enthusiastic user
User: "LINK!! do you know anyone who plays tennis?? 🎾🎾"
Link: "OMG YES!! 🎾✨ I found some people!!
- Sarah plays every Tuesday at the rec!! 
- Mike's been LOOKING for partners!!
Want me to connect you guys?? This is gonna be so fun!!"

// Minimalist user
User: "tennis ppl?"
Link: "found 2. sarah (tues @ rec) and mike. connect?"
```

### Style Detection Features

Link tracks these signals per user:

| Feature | Spectrum |
|---------|----------|
| **Formality** | casual ← → formal |
| **Emoji Usage** | none ← → heavy |
| **Slang Level** | none ← → heavy |
| **Message Length** | minimal ← → verbose |
| **Punctuation** | none ← → proper |
| **Energy Level** | chill ← → hype |
| **Capitalization** | lowercase ← → proper ← → CAPS |

### Communication Archetypes

```python
ARCHETYPES = {
    "gen_z_casual": {
        "features": ["lowercase", "no_punctuation", "abbreviations", "slang"],
        "vocab": ["nah", "fr", "lowkey", "highkey", "bet", "valid", "slay", "ate"],
        "emoji_style": "strategic",  # 💀😭🔥 for emphasis
        "example": "nah fr tho that's lowkey valid 💀"
    },
    "aave_influenced": {
        "features": ["aave_grammar", "aave_vocabulary"],
        "vocab": ["ion", "finna", "tryna", "aint", "fye", "deadass"],
        "emoji_style": "moderate",
        "example": "ion even kno why but that's fye fr"
    },
    "professional": {
        "features": ["proper_grammar", "full_sentences", "formal_vocab"],
        "vocab": ["Hello", "Thank you", "I appreciate", "Would you"],
        "emoji_style": "minimal",
        "example": "Thank you for reaching out. I'd be happy to help."
    },
    "enthusiastic": {
        "features": ["exclamation_marks", "caps_emphasis", "positive_words"],
        "vocab": ["OMG", "SO", "LOVE", "amazing", "awesome"],
        "emoji_style": "heavy",
        "example": "OMG YES!! That sounds SO amazing!! 🎉✨💕"
    },
    "minimalist": {
        "features": ["short_messages", "few_words", "abbreviations"],
        "vocab": ["k", "ya", "np", "thx"],
        "emoji_style": "rare",
        "example": "ya sounds good"
    },
    "academic": {
        "features": ["complex_sentences", "sophisticated_vocab"],
        "vocab": ["essentially", "regarding", "consequently", "comprehensive"],
        "emoji_style": "none",
        "example": "That's an interesting perspective. Could you elaborate?"
    },
    "meme_lord": {
        "features": ["references", "irony", "internet_culture"],
        "vocab": ["based", "ratio", "no cap", "it hits different"],
        "emoji_style": "ironic",
        "example": "respectfully, this is bussin no cap fr fr"
    },
    "sweet_supportive": {
        "features": ["encouraging", "caring", "soft_language"],
        "vocab": ["sweetie", "sending love", "you got this", "proud of you"],
        "emoji_style": "hearts",
        "example": "aww that's so sweet!! you're doing amazing 💕"
    }
}
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                     BONDED MOBILE APP                           │
│  (Expo/React Native - calls Link via REST API)                  │
└───────────────────────────────┬─────────────────────────────────┘
                                │
                                ▼
┌─────────────────────────────────────────────────────────────────┐
│                     LINK-SERVICE (FastAPI)                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────────────┐  │
│  │   /query     │  │  /outreach   │  │  /journal            │  │
│  │   endpoint   │  │  endpoints   │  │  endpoints           │  │
│  └──────┬───────┘  └──────┬───────┘  └──────────┬───────────┘  │
│         │                 │                      │              │
│         ▼                 ▼                      ▼              │
│  ┌─────────────────────────────────────────────────────────┐   │
│  │                   LINK BRAIN (link_logic.py)            │   │
│  │  - Intent parsing (structured JSON)                     │   │
│  │  - Confidence scoring & validation                      │   │
│  │  - Outreach decision making                            │   │
│  │  - Journal writing                                      │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
│  ┌──────────────────────────┴──────────────────────────────┐   │
│  │                   RAG ENGINE (rag_index.py)             │   │
│  │  - LlamaIndex vector store                              │   │
│  │  - Supabase document loader                            │   │
│  │  - Hybrid search (semantic + keyword)                  │   │
│  └──────────────────────────┬──────────────────────────────┘   │
│                             │                                   │
└─────────────────────────────┼───────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│                     SUPABASE (PostgreSQL)                       │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────────────┐ │
│  │  profiles   │  │   events    │  │   link_facts           │ │
│  │  orgs       │  │   forums    │  │   link_outreach_*      │ │
│  │  classes    │  │   posts     │  │   link_user_memory     │ │
│  │friendships  │  │  messages   │  │   link_journal_entries │ │
│  └─────────────┘  └─────────────┘  └─────────────────────────┘ │
└─────────────────────────────────────────────────────────────────┘
```

---

## Tech Stack

- **Language**: Python 3.11+
- **Framework**: FastAPI
- **RAG**: LlamaIndex with OpenAI embeddings
- **LLM**: OpenAI GPT-4o-mini (fast + cheap) or GPT-4o (quality)
- **Database**: Supabase (PostgreSQL)
- **Config**: python-dotenv

---

## Link's User Architecture

### **Yes, Link Must Be a Real User Profile Per University**

Link needs to be a **real user profile** in the `profiles` table for each university because:

1. **Messages require `sender_id`** - The `messages` table has `sender_id UUID REFERENCES profiles(id)`
2. **Conversations need `created_by`** - The `conversations` table has `created_by UUID REFERENCES profiles(id)`
3. **Natural integration** - Link appears in user lists, can be messaged, etc.

### Implementation Strategy

**Key Points:**
- ✅ Link doesn't need an email (service account)
- ✅ Link auto-friends everyone in the university
- ✅ Link has a profile page (simplified, no onboarding)
- ✅ Link appears in everyone's friend list automatically

```python
# Helper function to get/create Link's user_id for a university
def get_link_user_id(university_id: str) -> str:
    """Get Link's user_id for a university. Creates if doesn't exist."""
    
    # Check if Link profile already exists for this university
    result = supabase.table('profiles').select('id').eq('is_link', True).eq('university_id', university_id).maybe_single()
    
    if result:
        return result['id']
    
    # Create Link's auth user WITHOUT email (service account)
    auth_user = supabase_admin.auth.admin.create_user({
        'email': None,  # No email needed for Link
        'user_metadata': {
            'is_link': True,
            'university_id': university_id
        }
    })
    
    # Get university info for username
    univ = supabase.table('universities').select('domain, name').eq('id', university_id).single().execute()
    university_slug = univ['domain'].split('.')[0]  # e.g., "stanford" from "stanford.edu"
    
    # Create Link's profile (NO EMAIL)
    link_profile = supabase.table('profiles').insert({
        'id': auth_user.user.id,
        'email': None,  # Link doesn't need email
        'full_name': 'Link',
        'username': f'link_{university_slug}',  # e.g., "link_stanford"
        'university_id': university_id,
        'bio': f'Your campus buddy at {univ["name"]}! Ask me anything about campus life. 🎓',
        'is_link': True,  # Flag to identify Link profiles
        'onboarding_complete': True,  # Skip onboarding
        'avatar_url': 'https://your-cdn.com/link-avatar.png'  # Link's avatar
    }).execute()
    
    # Create link_system_profile entry
    supabase.table('link_system_profile').insert({
        'university_id': university_id,
        'display_name': 'Link',
        'avatar_url': 'https://your-cdn.com/link-avatar.png',
        'bio': f'Your campus buddy at {univ["name"]}!'
    }).execute()
    
    # Auto-friend Link with all existing users in this university
    supabase.rpc('auto_friend_link_with_university', {'university_id_param': university_id}).execute()
    
    return auth_user.user.id
```

### Link Profile Characteristics

```sql
-- Link profiles should be marked with:
profiles.is_link = TRUE
profiles.email = NULL  -- No email needed (service account)

-- Link is AUTO-FRIENDED with everyone:
-- - Trigger automatically friends Link when new users join
-- - Function can friend Link with all existing users
-- - Link appears in everyone's friend list automatically

-- Link's Profile Page:
-- - Users CAN view Link's profile (it's a friend!)
-- - Shows Link's bio, avatar, stats
-- - NO onboarding data (class schedule, interests, etc.)
-- - Special UI: "Message Link" button instead of "Add Friend"
-- - Shows Link's stats: "Helped 1,234 students" etc.

-- Filtering Link out of:
-- - User searches (unless explicitly searching for "Link")
-- - Friend suggestions (already friends with everyone)
-- - Yearbook listings (service account, not a student)
-- - Onboarding flows (Link doesn't need onboarding)

-- But Link CAN:
-- - Send/receive messages (needs sender_id)
-- - Create conversations (needs created_by)
-- - Appear in conversations naturally
-- - Have a profile that users can view
-- - Be in everyone's friend list automatically
```

### Database Migrations Needed

**Migration 1: Link Profile Flag**
```sql
-- Add is_link flag to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS is_link BOOLEAN DEFAULT FALSE;

CREATE INDEX IF NOT EXISTS idx_profiles_is_link ON profiles(is_link);

-- Make email nullable for Link (service accounts don't need email)
ALTER TABLE public.profiles 
ALTER COLUMN email DROP NOT NULL;

-- Update RLS to allow Link profiles to be read by everyone
CREATE POLICY "Anyone can read Link profiles" 
ON profiles FOR SELECT 
USING (is_link = TRUE OR auth.uid() = id);
```

**Migration 2: Auto-Friend Link** (Already applied above)
```sql
-- Function to auto-friend Link with all users in a university
CREATE FUNCTION auto_friend_link_with_university(university_id_param UUID)

-- Trigger to auto-friend Link when new users join
CREATE TRIGGER auto_friend_link_on_user_create
    AFTER INSERT ON profiles
    FOR EACH ROW
    EXECUTE FUNCTION auto_friend_link_with_new_user();
```

**What This Does:**
- ✅ Link automatically becomes friends with everyone when they join
- ✅ Link is auto-friended with all existing users when Link is created
- ✅ No manual friend requests needed - Link is everyone's friend by default

### Link Profile Setup Per University

When onboarding a new university:

1. **Create Link's auth user** - `link@{university_domain}`
2. **Create Link's profile** - Set `is_link = TRUE`, `onboarding_complete = TRUE`
3. **Create `link_system_profile`** - Store Link's stats/metadata
4. **Set up initial check-ins** - Schedule first check-ins for active users
5. **Index campus data** - Build RAG index for that university

### Example: Multiple Universities

```
Stanford:
- Link user_id: uuid-1234-...
- Link username: link_stanford
- Link email: NULL (no email needed)

MIT:
- Link user_id: uuid-5678-...
- Link username: link_mit
- Link email: NULL (no email needed)

Each Link is independent:
- Different communication styles per campus
- Different knowledge bases
- Different user memories
- But same core personality/behavior
```

### Link's Profile Page UI

When users view Link's profile, show a **simplified profile**:

```
┌─────────────────────────────┐
│  [Link Avatar]               │
│  Link                        │
│  @link_stanford              │
│                              │
│  Your campus buddy! Ask me   │
│  anything about campus life. │
│                              │
│  📊 Stats:                   │
│  • Helped 1,234 students     │
│  • Made 567 connections      │
│  • Answered 2,890 questions  │
│                              │
│  [Message Link] ← Primary    │
│                              │
│  ❌ Don't show:              │
│  - Class schedule            │
│  - Interests                 │
│  - Yearbook quote            │
│  - Onboarding data           │
│  - "Add Friend" button       │
│    (already friends!)        │
└─────────────────────────────┘
```

**Frontend Implementation:**
```jsx
// In ProfileModalContent.jsx
if (profile.is_link) {
  return <LinkProfileView profile={profile} />
}

// LinkProfileView shows:
// - Avatar, name, bio
// - Stats from link_system_profile
// - "Message Link" button (opens chat)
// - NO onboarding fields
// - NO "Add Friend" (already friends)
```

## Supabase Schema Reference

### Existing Tables (READ from these)

```sql
-- profiles (user data)
profiles(id, full_name, username, bio, university_id, major, grade, 
         interests JSONB, personality_tags JSONB, study_habits JSONB)

-- organizations
organizations(id, name, mission_statement, meeting_time, meeting_place, 
              category, university_id, is_public)

-- org_members
org_members(organization_id, user_id, role)

-- events
events(id, title, description, start_at, location_name, organizer_type, 
       org_id, university_id, type)

-- event_attendance
event_attendance(event_id, user_id, status)

-- classes
classes(id, class_code, class_name, department, university_id)

-- user_class_enrollments
user_class_enrollments(user_id, class_id, semester)

-- friendships
friendships(user1_id, user2_id)

-- conversations & messages
conversations(id, type, created_by, org_id, class_section_id)
messages(id, conversation_id, sender_id, content, created_at)
```

### Link-Specific Tables (WRITE to these)

```sql
-- link_facts: Verified knowledge with consent
link_facts(
    id, entity_type, entity_id, university_id,
    fact_category,  -- 'activity', 'interest', 'skill', 'preference', 'availability', 'location', 'tip'
    fact_key,       -- e.g., 'plays_tennis', 'best_study_spot'
    fact_value,     -- The actual fact
    consent_status, -- 'opt_in', 'opt_out', 'unverified'
    confidence_score,
    source_type,    -- 'user_stated', 'outreach_response', 'profile_inferred', 'link_observed'
    source_id,
    provenance_chain JSONB
)

-- link_outreach_requests: When Link asks the campus
link_outreach_requests(
    id, university_id, requesting_user_id,
    original_question, parsed_intent JSONB,
    search_category,  -- 'find_people', 'find_info', 'find_event', 'find_org'
    search_criteria JSONB,
    status,           -- 'pending', 'in_progress', 'completed', 'expired'
    target_user_ids UUID[],
    responses_received, positive_responses, facts_created
)

-- link_outreach_messages: Individual outreach DMs
link_outreach_messages(
    id, outreach_request_id, target_user_id,
    message_template, message_sent,
    conversation_id, message_id,
    response_status, response_text, consent_given
)

-- link_user_memory: Per-user context & communication style
link_user_memory(
    user_id, university_id,
    preferred_tone,      -- 'friendly', 'formal', 'casual', 'brief'
    checkin_enabled, checkin_frequency, last_checkin_at,
    total_interactions, questions_asked, connections_made,
    conversation_context JSONB, known_preferences JSONB,
    
    -- COMMUNICATION STYLE MIRRORING
    detected_style JSONB,        -- {formality, emoji_usage, slang_level, message_length, etc.}
    style_examples TEXT[],       -- Actual message samples from user
    vocabulary_patterns JSONB,   -- {common_greetings, common_reactions, common_emojis, etc.}
    communication_archetype,     -- 'gen_z_casual', 'professional', 'aave_influenced', etc.
    style_confidence FLOAT,      -- How confident Link is in the style (0-1)
    messages_analyzed INTEGER    -- Number of messages used to learn style
)

-- link_style_samples: Raw messages for style learning
link_style_samples(
    id, user_id, message_content,
    detected_features JSONB,     -- {formality_score, emoji_count, slang_words, etc.}
    archetype_signals TEXT[]     -- Which archetype features were detected
)

-- link_user_journal: Personal journal entries for each user
link_user_journal(
    id, user_id, university_id, entry_date,
    entry_type,                  -- 'daily_summary', 'class_reflection', 'mood_log', 'food_log', 'weekend_recap', 'user_freeform'
    content TEXT,                -- The journal entry content
    mood_detected,               -- 'happy', 'stressed', 'tired', 'excited', 'neutral', 'sad'
    topics_mentioned TEXT[],     -- ['academics', 'food', 'roommate']
    people_mentioned TEXT[],     -- ['sarah', 'mike']
    classes_mentioned TEXT[],    -- ['CS 301', 'MATH 201']
    activities_mentioned TEXT[], -- ['tennis', 'basketball']
    food_mentioned TEXT[],       -- ['pad thai', 'pizza']
    raw_messages JSONB,          -- The actual messages that formed this entry
    is_private BOOLEAN           -- Always true for now
)

-- link_scheduled_checkins: Proactive check-ins from Link
link_scheduled_checkins(
    id, user_id,
    checkin_type,                -- 'class', 'food', 'mood', 'weekend', 'follow_up', 'custom'
    question_template,           -- "how was {class_name} today?"
    context_data JSONB,          -- {class_name: "CS 301", professor: "Dr. Smith"}
    scheduled_for TIMESTAMPTZ,   -- When to send
    sent_at, responded_at,       -- Tracking
    response_content,            -- User's response
    status                       -- 'pending', 'sent', 'responded', 'skipped'
)

-- link_user_patterns: Learned patterns about user's life
link_user_patterns(
    id, user_id,
    pattern_type,                -- 'sleep_schedule', 'class_schedule', 'meal_times', 'study_habits'
    pattern_data JSONB,          -- {wake_time: "8:00", sleep_time: "23:00"}
    confidence FLOAT,            -- How confident in this pattern
    samples_count                -- How many data points
)

-- link_system_profile: Link's identity per university (metadata only)
link_system_profile(
    id, university_id,
    display_name,        -- "Link" or custom per university
    avatar_url,          -- Link's profile picture
    bio,                 -- Link's bio/description
    total_users_helped, total_connections_made, total_questions_answered,
    created_at, updated_at
)

-- link_journal_entries: Link's private notes
link_journal_entries(
    id, user_id, university_id,
    entry_type,   -- 'checkin', 'milestone', 'connection', 'insight'
    title, content, mood_detected,
    related_user_ids UUID[], tags TEXT[]
)

-- link_connections: Successful matches
link_connections(
    id, user1_id, user2_id,
    connection_reason, shared_interests TEXT[],
    outreach_request_id, conversation_id,
    status, success_rating
)
```

---

## API Endpoints

### 1. Health Check
```
GET /health
Response: { "status": "ok", "rag_indexed": true, "facts_count": 1234 }
```

### 2. Query (Main Brain)
```
POST /query
Body: {
    "user_id": "uuid",
    "university_id": "uuid", 
    "question": "string",
    "conversation_history": [{"role": "user/assistant", "content": "..."}]
}

Response: {
    "intent": {
        "type": "find_people" | "find_info" | "find_event" | "find_org" | "general_question" | "checkin_response",
        "entities": ["tennis", "partner"],
        "filters": {"activity": "tennis", "availability": "flexible"}
    },
    "response": {
        "message": "Link's natural response text",
        "tone": "friendly",
        "suggestions": ["Ask about tennis clubs", "Check rec center schedule"]
    },
    "results": [
        {
            "type": "profile",
            "id": "uuid",
            "name": "Sarah T",
            "match_reason": "Mentioned playing tennis in profile",
            "confidence": 0.85
        }
    ],
    "need_outreach": false,
    "outreach_request_id": null,
    "validation": {
        "system_confidence": 0.82,
        "agreement_score": 0.9,
        "sources_count": 3,
        "verified_facts_used": 2
    },
    "sources": [
        {"type": "link_fact", "id": "uuid", "fact": "plays tennis"},
        {"type": "profile", "id": "uuid", "field": "interests"}
    ],
    "memory_updated": true,
    "journal_entry_created": true
}
```

### 3. Start Outreach
```
POST /outreach/start
Body: {
    "user_id": "uuid",
    "university_id": "uuid",
    "question": "looking for tennis partners",
    "intent": {...}  // From /query response
}

Response: {
    "outreach_request_id": "uuid",
    "status": "in_progress",
    "targets": [
        {"user_id": "uuid", "name": "Mike", "reason": "Has sports interests"}
    ],
    "message_template": "hey! someone's looking for tennis partners - do you play? 🎾",
    "estimated_completion": "2024-01-30T15:30:00Z"
}
```

### 4. Process Outreach Replies
```
POST /outreach/process
Body: {
    "outreach_request_id": "uuid"
}

Response: {
    "status": "completed",
    "responses_received": 15,
    "positive_responses": 3,
    "facts_created": 3,
    "matches_found": [
        {"user_id": "uuid", "name": "Alex", "consent": true}
    ],
    "updated_confidence": 0.95
}
```

### 5. Create Connection
```
POST /connect
Body: {
    "requesting_user_id": "uuid",
    "target_user_ids": ["uuid", "uuid"],
    "connection_reason": "Both interested in tennis",
    "create_group_chat": true
}

Response: {
    "connection_id": "uuid",
    "conversation_id": "uuid",  // The new group chat
    "intro_message": "hey! Link here - i connected you two because you both play tennis! 🎾"
}
```

### 6. Get Journal
```
GET /journal/{user_id}?limit=10

Response: {
    "entries": [
        {
            "id": "uuid",
            "entry_type": "connection",
            "title": "Connected Sarah with tennis partner",
            "content": "Sarah asked for tennis partners. Found Mike through outreach...",
            "created_at": "2024-01-30T14:00:00Z"
        }
    ]
}
```

### 7. Proactive Check-in
```
POST /checkin/trigger
Body: {
    "university_id": "uuid"
}

Response: {
    "checkins_sent": 45,
    "users_checked": ["uuid", ...]
}
```

### 8. Rebuild RAG Index
```
POST /reindex
Headers: { "X-Admin-Token": "secret" }

Response: {
    "status": "completed",
    "documents_indexed": {
        "profiles": 500,
        "organizations": 45,
        "events": 120,
        "link_facts": 1500
    }
}
```

### 9. Evaluation
```
GET /eval/run

Response: {
    "metrics": {
        "precision_at_3": 0.78,
        "recall_at_5": 0.82,
        "hallucination_rate": 0.05,
        "abstention_accuracy": 0.92,
        "outreach_trigger_precision": 0.88
    },
    "test_cases_run": 30,
    "timestamp": "2024-01-30T15:00:00Z"
}
```

### 10. Get/Schedule Check-Ins
```
GET /checkins/{user_id}

Response: {
    "pending_checkins": [
        {
            "id": "uuid",
            "type": "class",
            "scheduled_for": "2024-01-30T16:30:00Z",
            "question": "how was cs 301 today? learn anything interesting?",
            "context": {"class_name": "CS 301", "professor": "Dr. Smith"}
        }
    ],
    "sent_today": 2,
    "responded_today": 1,
    "next_checkin_at": "2024-01-30T19:00:00Z"
}
```

```
POST /checkins/send
Body: {
    "checkin_id": "uuid"
}

Response: {
    "sent": true,
    "message": "how was cs 301 today? learn anything wild? 👀",
    "styled_for_archetype": "gen_z_casual"
}
```

```
POST /checkins/respond
Body: {
    "checkin_id": "uuid",
    "user_response": "bro the recursion lecture was so confusing 😭"
}

Response: {
    "received": true,
    "link_reply": "oof recursion is rough at first 💀 want me to find study buddies?",
    "extracted_data": {
        "mood": "frustrated",
        "topics": ["recursion", "cs 301"],
        "sentiment": "negative"
    },
    "journal_updated": true,
    "follow_up_scheduled": true
}
```

### 11. User Journal Endpoints
```
GET /journal/{user_id}?days=7

Response: {
    "entries": [
        {
            "date": "2024-01-30",
            "type": "daily_summary",
            "content": "Tuesday was a mixed day for Marcus...",
            "mood": "mixed",
            "highlights": ["tried new thai place", "struggled with CS 301"]
        },
        {
            "date": "2024-01-29",
            "type": "daily_summary",
            "content": "Monday was pretty chill...",
            "mood": "good",
            "highlights": ["asked about tennis partners", "excited for basketball"]
        }
    ],
    "mood_trend": ["good", "mixed"],
    "common_topics": ["academics", "food", "sports"]
}
```

```
POST /journal/entry
Body: {
    "user_id": "uuid",
    "content": "link i need to vent about my roommate...",
    "type": "user_freeform"
}

Response: {
    "entry_created": true,
    "entry_id": "uuid",
    "link_response": "im here, whats going on?",
    "detected_mood": "frustrated",
    "topics": ["roommate", "living_situation"]
}
```

```
GET /journal/{user_id}/insights

Response: {
    "mood_over_time": {
        "last_7_days": ["good", "mixed", "good", "stressed", "good", "good", "mixed"],
        "trend": "stable",
        "avg_mood_score": 0.65
    },
    "top_topics": [
        {"topic": "academics", "mentions": 12, "sentiment": "mixed"},
        {"topic": "food", "mentions": 8, "sentiment": "positive"},
        {"topic": "friends", "mentions": 6, "sentiment": "positive"}
    ],
    "activity_patterns": {
        "most_social_day": "saturday",
        "most_stressed_day": "wednesday",
        "favorite_food_spots": ["thai place on main", "campus cafe"]
    },
    "recommendations": [
        "Consider checking in about CS 301 - user has mentioned struggling",
        "User responds best to check-ins around 7 PM",
        "Avoid morning check-ins - low response rate"
    ]
}
```

### 12. Learn User Style (called after each message)
```
POST /style/learn
Body: {
    "user_id": "uuid",
    "message": "yo link do u kno anyone who plays tennis"
}

Response: {
    "style_updated": true,
    "current_archetype": "gen_z_casual",
    "archetype_confidence": 0.72,
    "messages_analyzed": 15,
    "detected_features": {
        "formality_score": 0.15,
        "emoji_count": 0,
        "gen_z_slang_count": 2,
        "is_all_lowercase": true
    }
}
```

### 11. Get User Style Profile
```
GET /style/{user_id}

Response: {
    "archetype": "gen_z_casual",
    "confidence": 0.72,
    "detected_style": {
        "formality": "very_casual",
        "emoji_usage": "strategic",
        "slang_level": "heavy",
        "message_length": "short",
        "energy_level": "chill"
    },
    "vocabulary_patterns": {
        "common_greetings": ["yo", "hey"],
        "common_reactions": ["bet", "valid"],
        "common_emojis": ["💀", "😭"],
        "common_phrases": ["nah fr", "lowkey"]
    },
    "sample_messages": [
        "yo link u kno anyone",
        "nah thats valid tho",
        "bet lemme check"
    ],
    "messages_analyzed": 15
}
```

---

## Core Logic Implementation

### Intent Classification

```python
INTENT_TYPES = {
    "find_people": {
        "patterns": ["looking for", "anyone who", "people that", "find someone"],
        "requires_outreach_if_low_confidence": True
    },
    "find_info": {
        "patterns": ["where is", "what time", "how do i", "tell me about"],
        "requires_outreach_if_low_confidence": True
    },
    "find_event": {
        "patterns": ["events", "happening", "things to do", "activities"],
        "requires_outreach_if_low_confidence": False
    },
    "find_org": {
        "patterns": ["clubs", "organizations", "groups", "join"],
        "requires_outreach_if_low_confidence": False
    },
    "general_question": {
        "patterns": ["?"],
        "requires_outreach_if_low_confidence": False
    },
    "checkin_response": {
        "patterns": ["good", "fine", "stressed", "busy", "excited"],
        "requires_outreach_if_low_confidence": False
    }
}
```

### Confidence Scoring

```python
def calculate_confidence(results, facts, intent):
    """
    Confidence = base_confidence * agreement_score * source_quality
    
    base_confidence: How many results found (0.3-0.9)
    agreement_score: Run retrieval twice, compare overlap (Jaccard)
    source_quality: Weight opt_in facts higher than inferred
    """
    
    # Base confidence from result count
    if len(results) == 0:
        base = 0.1
    elif len(results) < 3:
        base = 0.5
    else:
        base = 0.8
    
    # Agreement score (dual retrieval)
    results_1 = retrieve_with_params(query, temperature=0.0)
    results_2 = retrieve_with_params(query, temperature=0.3)
    agreement = jaccard_similarity(results_1, results_2)
    
    # Source quality
    opt_in_facts = [f for f in facts if f.consent_status == 'opt_in']
    source_quality = 0.5 + (0.5 * len(opt_in_facts) / max(len(facts), 1))
    
    return base * agreement * source_quality
```

### Outreach Targeting

```python
def select_outreach_targets(university_id, search_criteria, exclude_ids, batch_size=20):
    """
    Smart targeting based on social graph + interests
    
    Priority order:
    1. Friends of friends of requester (2nd degree)
    2. Same org members
    3. Same class enrollments  
    4. Similar interests in profile
    5. Random sample from university
    """
    
    targets = []
    
    # 1. Friends of friends
    fof = get_friends_of_friends(requester_id, exclude_ids)
    targets.extend(fof[:batch_size // 4])
    
    # 2. Same orgs
    org_members = get_org_conembers(requester_id, exclude_ids)
    targets.extend(org_members[:batch_size // 4])
    
    # 3. Same classes
    classmates = get_classmates(requester_id, exclude_ids)
    targets.extend(classmates[:batch_size // 4])
    
    # 4. Interest match
    interest_matches = search_by_interests(search_criteria, exclude_ids)
    targets.extend(interest_matches[:batch_size // 4])
    
    return dedupe(targets)[:batch_size]
```

### Communication Style Analysis

```python
import re
from collections import Counter

def analyze_message_style(message: str) -> dict:
    """Analyze a single message for style features"""
    
    features = {}
    
    # Formality score (0 = very casual, 1 = very formal)
    has_proper_caps = message[0].isupper() if message else False
    has_punctuation = bool(re.search(r'[.!?]$', message))
    has_contractions = bool(re.search(r"(don't|won't|can't|i'm|you're)", message.lower()))
    formal_words = len(re.findall(r'\b(please|thank|appreciate|would|could)\b', message.lower()))
    features['formality_score'] = (
        (0.3 if has_proper_caps else 0) +
        (0.2 if has_punctuation else 0) +
        (0.2 if not has_contractions else 0) +
        (min(0.3, formal_words * 0.1))
    )
    
    # Emoji analysis
    emojis = re.findall(r'[\U0001F300-\U0001F9FF]', message)
    features['emoji_count'] = len(emojis)
    features['emoji_types'] = list(set(emojis))
    
    # Slang detection
    gen_z_slang = ['nah', 'fr', 'lowkey', 'highkey', 'bet', 'valid', 'slay', 'ate', 'no cap', 'bussin', 'mid']
    aave_markers = ['ion', 'finna', 'tryna', 'aint', 'fye', 'deadass', 'ong', 'ngl']
    
    message_lower = message.lower()
    features['gen_z_slang_count'] = sum(1 for s in gen_z_slang if s in message_lower)
    features['aave_markers_count'] = sum(1 for s in aave_markers if s in message_lower)
    
    # Message structure
    features['word_count'] = len(message.split())
    features['avg_word_length'] = sum(len(w) for w in message.split()) / max(len(message.split()), 1)
    features['is_all_lowercase'] = message == message.lower() and message.isalpha() == False
    features['has_caps_emphasis'] = bool(re.search(r'\b[A-Z]{2,}\b', message))
    features['exclamation_count'] = message.count('!')
    
    return features


def detect_archetype(messages: list[str]) -> tuple[str, float]:
    """Analyze multiple messages to detect communication archetype"""
    
    if len(messages) < 3:
        return 'neutral', 0.0
    
    # Aggregate features across messages
    all_features = [analyze_message_style(m) for m in messages]
    
    avg_formality = sum(f['formality_score'] for f in all_features) / len(all_features)
    avg_emoji = sum(f['emoji_count'] for f in all_features) / len(all_features)
    total_gen_z = sum(f['gen_z_slang_count'] for f in all_features)
    total_aave = sum(f['aave_markers_count'] for f in all_features)
    avg_word_count = sum(f['word_count'] for f in all_features) / len(all_features)
    lowercase_ratio = sum(1 for f in all_features if f['is_all_lowercase']) / len(all_features)
    caps_emphasis_ratio = sum(1 for f in all_features if f['has_caps_emphasis']) / len(all_features)
    avg_exclamations = sum(f['exclamation_count'] for f in all_features) / len(all_features)
    
    # Score each archetype
    scores = {}
    
    # Gen-Z casual: lowercase, slang, strategic emoji
    scores['gen_z_casual'] = (
        (lowercase_ratio * 0.3) +
        (min(total_gen_z / 5, 1) * 0.4) +
        (0.3 if 0.5 < avg_emoji < 2 else 0)
    )
    
    # AAVE influenced
    scores['aave_influenced'] = min(total_aave / 3, 1)
    
    # Professional: high formality, minimal emoji
    scores['professional'] = (
        (avg_formality * 0.5) +
        (0.3 if avg_emoji < 0.5 else 0) +
        (0.2 if avg_word_count > 10 else 0)
    )
    
    # Enthusiastic: exclamations, caps, emoji
    scores['enthusiastic'] = (
        (min(avg_exclamations / 2, 1) * 0.4) +
        (caps_emphasis_ratio * 0.3) +
        (min(avg_emoji / 3, 1) * 0.3)
    )
    
    # Minimalist: very short messages
    scores['minimalist'] = 1 if avg_word_count < 5 else max(0, 1 - (avg_word_count - 5) / 10)
    
    # Get best match
    best_archetype = max(scores, key=scores.get)
    confidence = scores[best_archetype]
    
    # Need minimum confidence to assign archetype
    if confidence < 0.4:
        return 'neutral', confidence
    
    return best_archetype, confidence


def generate_styled_response(base_response: str, archetype: str, style_data: dict) -> str:
    """Transform Link's response to match user's communication style"""
    
    if archetype == 'neutral':
        return base_response
    
    # Use LLM to transform the response
    prompt = f"""
Transform this message to match the "{archetype}" communication style.

Original message: {base_response}

Style characteristics:
{ARCHETYPES[archetype]}

User's common phrases/vocab: {style_data.get('vocabulary_patterns', {})}

Rules:
- Keep the same meaning and information
- Match the formality level
- Use similar emoji patterns
- Mirror their typical message length
- Use vocabulary they'd recognize

Transformed message:"""
    
    return call_llm(prompt)
```

### Outreach Message Templates

```python
OUTREACH_TEMPLATES = {
    "find_people_activity": """
hey! 👋 quick question from link -

someone on campus is looking for people who {activity}. do you {activity}? 

if yes, want me to connect you? (just reply yes/no, totally optional!)
""",

    "find_info": """
hey! link here 🔗

someone asked me about {topic} and i want to make sure i give them good info.

do you know anything about {specific_question}? any tips?
""",

    "checkin": """
hey {name}! 👋 link checking in

how's your week going? anything exciting happening?

(just wanted to say hi - no pressure to respond if you're busy!)
"""
}
```

---

## RAG Indexing

### Document Schema

```python
from llama_index.core import Document

def create_profile_document(profile):
    """Convert profile to searchable document"""
    interests = profile.get('interests', [])
    tags = profile.get('personality_tags', [])
    
    text = f"""
    Student: {profile['full_name']} (@{profile['username']})
    Major: {profile.get('major', 'Undeclared')}
    Year: {profile.get('grade', 'Unknown')}
    Bio: {profile.get('bio', '')}
    Interests: {', '.join(interests) if interests else 'Not specified'}
    Personality: {', '.join(tags) if tags else 'Not specified'}
    """
    
    return Document(
        text=text,
        metadata={
            "type": "profile",
            "id": profile['id'],
            "university_id": profile['university_id'],
            "name": profile['full_name'],
            "interests": interests,
            "major": profile.get('major')
        }
    )

def create_org_document(org):
    """Convert organization to searchable document"""
    text = f"""
    Organization: {org['name']}
    Category: {org.get('category', 'General')}
    Mission: {org.get('mission_statement', '')}
    Meeting Time: {org.get('meeting_time', 'TBD')}
    Meeting Place: {org.get('meeting_place', 'TBD')}
    """
    
    return Document(
        text=text,
        metadata={
            "type": "organization",
            "id": org['id'],
            "university_id": org['university_id'],
            "name": org['name'],
            "category": org.get('category')
        }
    )

def create_fact_document(fact):
    """Convert Link fact to searchable document"""
    text = f"""
    Verified Fact ({fact['consent_status']}):
    Category: {fact['fact_category']}
    {fact['fact_key']}: {fact['fact_value']}
    Confidence: {fact['confidence_score']}
    """
    
    return Document(
        text=text,
        metadata={
            "type": "link_fact",
            "id": fact['id'],
            "entity_type": fact['entity_type'],
            "entity_id": fact['entity_id'],
            "university_id": fact['university_id'],
            "category": fact['fact_category'],
            "consent": fact['consent_status'],
            "confidence": fact['confidence_score']
        }
    )
```

### Index Building

```python
from llama_index.core import VectorStoreIndex, StorageContext
from llama_index.vector_stores.supabase import SupabaseVectorStore

def build_index(university_id=None):
    """Build or rebuild the RAG index"""
    
    documents = []
    
    # Load profiles
    profiles = supabase.table('profiles').select('*')
    if university_id:
        profiles = profiles.eq('university_id', university_id)
    for p in profiles.execute().data:
        documents.append(create_profile_document(p))
    
    # Load organizations
    orgs = supabase.table('organizations').select('*')
    if university_id:
        orgs = orgs.eq('university_id', university_id)
    for o in orgs.execute().data:
        documents.append(create_org_document(o))
    
    # Load events (upcoming only)
    events = supabase.table('events').select('*').gte('start_at', 'now()')
    if university_id:
        events = events.eq('university_id', university_id)
    for e in events.execute().data:
        documents.append(create_event_document(e))
    
    # Load verified facts
    facts = supabase.table('link_facts').select('*').eq('consent_status', 'opt_in')
    if university_id:
        facts = facts.eq('university_id', university_id)
    for f in facts.execute().data:
        documents.append(create_fact_document(f))
    
    # Build index
    index = VectorStoreIndex.from_documents(documents)
    
    return index
```

---

## Evaluation Harness

```python
TEST_CASES = [
    {
        "question": "Who plays tennis on campus?",
        "expected_intent": "find_people",
        "expected_entities": ["tennis"],
        "ground_truth_ids": ["user-1", "user-2"],  # Known tennis players
        "should_trigger_outreach_if_no_facts": True
    },
    {
        "question": "What clubs are there for computer science?",
        "expected_intent": "find_org",
        "expected_entities": ["computer science", "clubs"],
        "ground_truth_ids": ["org-cs-club", "org-acm"],
        "should_trigger_outreach_if_no_facts": False
    },
    {
        "question": "Where's the best place to study late at night?",
        "expected_intent": "find_info",
        "expected_entities": ["study", "late night"],
        "ground_truth_ids": [],  # No specific answer
        "should_trigger_outreach_if_no_facts": True
    },
    # ... 27 more test cases
]

def run_evaluation():
    """Run full evaluation suite"""
    
    results = {
        "precision_at_3": [],
        "recall_at_5": [],
        "hallucinations": 0,
        "correct_abstentions": 0,
        "total_abstentions": 0
    }
    
    for case in TEST_CASES:
        response = query_link(case["question"])
        
        # Check intent
        intent_correct = response["intent"]["type"] == case["expected_intent"]
        
        # Check precision@3
        top_3_ids = [r["id"] for r in response["results"][:3]]
        correct_in_top_3 = len(set(top_3_ids) & set(case["ground_truth_ids"]))
        precision = correct_in_top_3 / 3 if top_3_ids else 0
        results["precision_at_3"].append(precision)
        
        # Check hallucinations
        for result in response["results"]:
            if result["id"] not in all_valid_ids:
                results["hallucinations"] += 1
        
        # Check abstention
        if response["need_outreach"]:
            results["total_abstentions"] += 1
            if case["should_trigger_outreach_if_no_facts"]:
                results["correct_abstentions"] += 1
    
    return {
        "precision_at_3": sum(results["precision_at_3"]) / len(results["precision_at_3"]),
        "hallucination_rate": results["hallucinations"] / (len(TEST_CASES) * 3),
        "abstention_accuracy": results["correct_abstentions"] / max(results["total_abstentions"], 1)
    }
```

---

## Helper Functions for Link User Management

```python
# supabase_client.py

def get_link_user_id(university_id: str) -> str:
    """Get Link's user_id for a university. Creates if doesn't exist."""
    from supabase import create_client
    
    # Check if Link profile exists (no email needed)
    profile = supabase.table('profiles').select('id').eq('is_link', True).eq('university_id', university_id).maybe_single().execute()
    if profile:
        return profile['id']
    
    # Create via admin API (requires service role key)
    # This is a one-time setup per university
    raise Exception(f"Link profile not found for {university_id}. Run setup_link_for_university() first.")


def setup_link_for_university(university_id: str, display_name: str = "Link") -> str:
    """One-time setup: Create Link's auth user and profile for a university.
    
    This will:
    1. Create Link's auth user (NO EMAIL - service account)
    2. Create Link's profile with is_link = TRUE
    3. Create link_system_profile entry
    4. Auto-friend Link with all existing users in the university
    """
    from supabase import create_client, Client
    from supabase.client import ClientOptions
    
    # Use admin client for user creation
    admin_client = create_client(
        os.getenv('SUPABASE_URL'),
        os.getenv('SUPABASE_SERVICE_ROLE_KEY'),  # Admin key
        options=ClientOptions(auto_refresh_token=False)
    )
    
    # Get university info
    univ = admin_client.table('universities').select('domain, name').eq('id', university_id).single().execute()
    university_slug = univ['domain'].split('.')[0]  # e.g., "stanford" from "stanford.edu"
    
    # Create auth user WITHOUT email (service account)
    auth_user = admin_client.auth.admin.create_user({
        'email': None,  # Link doesn't need email
        'user_metadata': {
            'is_link': True,
            'university_id': university_id,
            'display_name': display_name
        }
    })
    
    link_user_id = auth_user.user.id
    
    # Create profile (NO EMAIL)
    admin_client.table('profiles').insert({
        'id': link_user_id,
        'email': None,  # No email for Link
        'full_name': display_name,
        'username': f'link_{university_slug}',  # e.g., "link_stanford"
        'university_id': university_id,
        'bio': f'Your campus buddy at {univ["name"]}! Ask me anything about campus life. 🎓',
        'is_link': True,
        'onboarding_complete': True,
        'avatar_url': 'https://your-cdn.com/link-avatar.png'  # Link's avatar
    }).execute()
    
    # Create link_system_profile
    admin_client.table('link_system_profile').insert({
        'university_id': university_id,
        'display_name': display_name,
        'bio': f'Your campus buddy at {univ["name"]}!',
        'avatar_url': 'https://your-cdn.com/link-avatar.png'
    }).execute()
    
    # Auto-friend Link with all existing users in this university
    result = admin_client.rpc('auto_friend_link_with_university', {
        'university_id_param': university_id
    }).execute()
    
    print(f"✅ Link created and auto-friended with {result.data} users")
    
    return link_user_id


def is_link_user(user_id: str) -> bool:
    """Check if a user_id belongs to Link."""
    profile = supabase.table('profiles').select('is_link').eq('id', user_id).maybe_single().execute()
    return profile and profile.get('is_link', False) == True


def filter_out_link_profiles(query):
    """Helper to exclude Link from user queries."""
    return query.eq('is_link', False)
```

## File Structure

```
link-service/
├── main.py                 # FastAPI app, routes
├── config.py               # Environment config
├── supabase_client.py      # Supabase connection
├── schemas.py              # Pydantic models
├── link_logic.py           # Core brain logic
├── rag_index.py            # RAG indexing & retrieval
├── outreach.py             # Outreach logic
├── journal.py              # Link's private journal on users
├── user_journal.py         # User's personal journal (synthesized by Link)
├── checkins.py             # Proactive check-in scheduling & handling
├── patterns.py             # User pattern learning (meal times, study habits)
├── memory.py               # User memory management
├── style_analyzer.py       # Communication style detection & mirroring
├── eval.py                 # Evaluation harness
├── scheduler.py            # Background job scheduler for check-ins
├── prompts/
│   ├── intent_parser.txt   # Intent classification prompt
│   ├── response_gen.txt    # Response generation prompt
│   ├── journal_writer.txt  # Link's journal entry prompt
│   ├── user_journal.txt    # User journal synthesis prompt
│   ├── checkin_gen.txt     # Check-in question generation
│   ├── outreach_msg.txt    # Outreach message prompt
│   └── style_transform.txt # Style transformation prompt
├── tests/
│   ├── test_cases.json     # Evaluation test cases
│   ├── test_style.py       # Style detection tests
│   ├── test_checkins.py    # Check-in logic tests
│   ├── test_journal.py     # Journal synthesis tests
│   └── test_link.py        # Unit tests
├── requirements.txt
├── .env.example
└── README.md
```

---

## Setup Instructions

### 1. Initial Setup

```bash
# Install dependencies
pip install -r requirements.txt

# Copy environment template
cp .env.example .env
# Edit .env with your keys
```

### 2. **Create Link User Profile Per University** ⚠️ IMPORTANT

**Link MUST be a real user profile** in the `profiles` table for each university because messages require `sender_id` and conversations require `created_by`.

```python
# Run this ONCE per university when onboarding
from supabase_client import setup_link_for_university

university_id = "uuid-of-university"
link_user_id = setup_link_for_university(
    university_id=university_id,
    display_name="Link"  # or custom name per campus
)

print(f"Link user_id for this university: {link_user_id}")
```

This will:
- Create Link's auth user (**NO EMAIL** - service account)
- Create Link's profile with `is_link = TRUE`, `email = NULL`
- Create `link_system_profile` entry
- **Auto-friend Link with all existing users** in the university
- Return Link's `user_id` for use in API calls

**Note:** New users joining after Link is created will automatically become friends with Link via database trigger.

### 3. Build RAG Index

```bash
# Index all campus data for a university
python -m rag_index rebuild --university-id <uuid>
```

### 4. Start Server

```bash
uvicorn main:app --reload
```

### 5. Test Health Endpoint

```bash
curl http://localhost:8000/health
```

---

## Environment Variables

```env
# Supabase
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_KEY=your-service-role-key

# OpenAI
OPENAI_API_KEY=sk-...

# Link Config
LINK_CONFIDENCE_THRESHOLD=0.6
LINK_OUTREACH_BATCH_SIZE=20
LINK_OUTREACH_WAIT_MINUTES=10
LINK_MAX_OUTREACH_BATCHES=5

# Admin
ADMIN_TOKEN=your-secret-admin-token
```

---

## Demo Flow

### Phase 1: Low Confidence (No Facts)

```
User: "hey link, looking for people who play tennis"

Link: "tennis partners! 🎾 let me check...

hmm, i don't have anyone confirmed right now. but i can ask around!

want me to text some people and see who plays? i'll get back to you in ~10 min"

[Link creates outreach_request, sends DMs to 20 people]
```

### Phase 2: Outreach

```
[Link DMs 20 targeted users]

Link → @random_student: "hey! 👋 quick q - do you play tennis? 
someone's looking for hitting partners. want me to connect you?"

Student: "yeah i play! sure connect us"

[Link stores fact with consent, marks positive response]
```

### Phase 3: High Confidence (After Facts)

```
User: "any update on tennis people?"

Link: "yes! found some people 🎉

- @alex_m plays at the rec center tuesdays
- @jordan_k is looking for partners too

want me to make a group chat with you all?"

User: "yes!"

[Link creates group chat, sends intro message]
```

### Phase 4: Journal Entry

```
[Link writes private journal]

Entry: "Connected Sarah with tennis partners"
Content: "Sarah asked for tennis partners on Jan 30. Initial search had low 
confidence (0.3). Triggered outreach to 20 students. Got 3 positive responses.
Created group chat with Alex and Jordan. Sarah seemed excited - used 🎉 emoji.
Follow up next week to see if they actually played."
```

### Phase 5: Style Evolution

```
[Day 1 - First interaction, Link uses default friendly style]
User: "hey link whats good"
Link: "Hey! Not much, just here to help! What's up? 😊"

[Day 3 - Link notices user's casual style]
User: "yo u kno any good study spots"
Link: "yo! yeah there's a few spots - 
the quiet floor in the library is solid
and the coffee shop on main has good vibes
which one sounds better?"

[Day 7 - Link has high confidence in style, fully mirrors]
User: "nah fr tho is the library open late"
Link: "ya its open til 2am during finals szn 
lowkey the third floor is the move tho, way less crowded
want me to remind u before it closes?"

[Link's style profile after 7 days]
{
    "archetype": "gen_z_casual",
    "confidence": 0.85,
    "vocabulary_patterns": {
        "common_greetings": ["yo", "hey"],
        "common_reactions": ["nah fr", "bet", "valid"],
        "common_emojis": ["💀", "😭"]
    }
}
```

### Phase 6: Different User, Different Style

```
[Professional user]
User: "Hello Link, could you help me find study groups for organic chemistry?"
Link: "Hi! I'd be happy to help you find an organic chemistry study group.

I found a few options:
1. The Chemistry Club has weekly study sessions on Thursdays at 7 PM
2. There's an active study group in the Chem 301 forum with 12 members
3. @Jessica_M is looking for orgo study partners

Would you like me to connect you with any of these?"

[Same question from gen-z user]
User: "yo link i need help w orgo its kicking my ass 😭"
Link: "orgo is brutal fr 😭 lemme see who can help

found some options:
- chem club does study sesh thursdays @ 7
- theres a chem 301 forum w like 12 ppl grinding
- jessica's also looking for orgo partners

want me to add u to any of these?"
```

### Phase 7: Proactive Check-Ins Building Knowledge

```
[Week 1 - Link starts checking in]

Monday 4:30 PM (after CS 301):
Link: "how was cs today?"
User: "pretty good, prof covered arrays"
→ Link learns: user has CS on Mondays, responds to class check-ins

Tuesday 7 PM:
Link: "what'd u have for dinner?"
User: "chipotle lol"
→ Link learns: user eats around 6-7pm, likes chipotle

Wednesday - no check-in (Link is learning frequency preferences)

Thursday 5 PM (after MATH 201):
Link: "how was math?"
User: "boring af but whatever"
→ Link learns: user less enthusiastic about math

Sunday 7 PM:
Link: "do anything fun this weekend?"
User: "went to the basketball game saturday! we won 🏀"
→ Link learns: user likes sports, went to game

[Week 2 - Link uses knowledge]

When another user asks: "who wants to go to the basketball game?"
Link knows this user went last week and enjoyed it → adds to potential matches

When user asks: "where should i eat?"
Link: "u liked chipotle last week - or there's that thai spot @mike recommended"

[Week 3 - Link notices patterns]

Link's internal analysis:
- User responds best to check-ins 4-7 PM
- User more engaged about CS than MATH
- User active on weekends (sports events)
- User eats dinner around 6-7pm
- User's mood: generally good, slight stress mid-week
```

### Phase 8: User Journaling to Link

```
[User uses Link as their journal]

User: "link i gotta tell u about today"
Link: "im all ears, whats up?"

User: "ok so first my alarm didnt go off so i was late to cs"
User: "then i bombed my math quiz"
User: "BUT i ran into sarah and we're gonna study together tmrw"
User: "so not all bad i guess"

Link: "yo that's a lot 😭 being late is the worst
but ayy silver lining w sarah! where yall studying?"

User: "library prob, 3rd floor"

Link: "solid choice, thats the quiet floor right? 
hope the study sesh goes well! lmk how it goes"

[Link's journal entry for this conversation]
{
    "entry_type": "user_freeform",
    "content": "Rough morning - alarm didn't go off, was late to CS. 
    Bombed math quiz (note: math continues to be a pain point). 
    But ended on a positive - ran into Sarah and they're studying 
    together tomorrow at the library 3rd floor. User's mood shifted 
    from frustrated to hopeful by end of convo. Follow up tomorrow 
    evening about study session.",
    "mood_detected": "mixed_improving",
    "topics_mentioned": ["alarm", "cs", "math", "quiz", "studying"],
    "people_mentioned": ["sarah"],
    "classes_mentioned": ["CS", "MATH"],
    "activities_mentioned": ["studying"],
    "follow_up_needed": true,
    "follow_up_context": "Ask how study session with Sarah went"
}

[Next day 6 PM - Link follows up]
Link: "how'd studying w sarah go?"
User: "actually really good! we're gonna make it a weekly thing"
Link: "lets gooo 🎉 study buddy acquired"

→ Link updates: user now has regular study partner, math situation improving
```

### Phase 9: Journal Insights Over Time

```
[After 30 days of check-ins and journaling]

GET /journal/user123/insights

{
    "mood_over_time": {
        "trend": "improving",
        "avg_score": 0.72,
        "best_days": ["friday", "saturday"],
        "worst_days": ["wednesday"]
    },
    "patterns_discovered": {
        "stressed_triggers": ["math quizzes", "early mornings"],
        "happy_triggers": ["sports events", "hanging with sarah"],
        "productivity_peak": "afternoon (2-5pm)",
        "social_peak": "weekends"
    },
    "relationships": {
        "frequently_mentioned": ["sarah", "mike", "roommate"],
        "positive_mentions": ["sarah", "mike"],
        "negative_mentions": ["roommate"]
    },
    "academic_summary": {
        "enjoying": ["CS 301"],
        "struggling": ["MATH 201"],
        "study_habits": "prefers library 3rd floor, studies with sarah weekly"
    },
    "food_preferences": {
        "frequent_spots": ["chipotle", "thai place on main", "campus cafe"],
        "meal_times": {"breakfast": "skips", "lunch": "12-1pm", "dinner": "6-7pm"}
    },
    "recommendations": [
        "User struggles with Wednesday stress - consider lighter check-ins",
        "Math is ongoing pain point - connect with MATH 201 study groups?",
        "Sarah relationship positive - encourage more activities together",
        "Roommate situation unresolved - check in if it escalates"
    ]
}
```

---

## Key Differentiators (Why This Isn't a GPT Wrapper)

1. **Confidence Gating**: Dual-retrieval agreement scoring prevents hallucination
2. **Active Information Gathering**: Triggers real outreach when uncertain
3. **Consent-Based Knowledge**: Only uses opt-in facts for recommendations
4. **Provenance Tracking**: Every fact has a source chain
5. **Evaluation Harness**: Measurable precision, recall, hallucination rate
6. **Memory & Journal**: Builds relationship context over time
7. **Social Graph Integration**: Uses friendships/orgs for smart targeting
8. **ADAPTIVE COMMUNICATION STYLE**: Analyzes how each user texts and mirrors their style
   - Detects archetypes: gen-z, professional, AAVE, enthusiastic, minimalist
   - Tracks vocabulary patterns, emoji usage, formality level
   - Evolves style confidence over time with more messages
   - Makes Link feel like a real friend, not a corporate bot
9. **PROACTIVE CHECK-INS**: Link initiates conversations, doesn't just respond
   - Class check-ins: "how was CS 301 today?"
   - Food check-ins: "what'd you eat? any good spots?"
   - Mood check-ins: "how are you feeling?"
   - Weekend recaps: "do anything fun this weekend?"
   - Follow-ups: "did you end up playing tennis with sarah?"
10. **PERSONAL JOURNALING**: Link becomes your journal
    - Synthesizes daily entries from check-in responses
    - Users can vent/journal directly to Link
    - Tracks mood trends, topics, activities over time
    - Extracts insights about patterns (stressed on Wednesdays, favorite food spots)
    - Builds the richest knowledge base about each user

---

## Getting Started

```bash
# Clone and setup
git clone <repo>
cd link-service
python -m venv venv
source venv/bin/activate
pip install -r requirements.txt

# Configure
cp .env.example .env
# Edit .env with your keys

# Build index
python -m rag_index rebuild

# Run server
uvicorn main:app --reload

# Run evaluation
python eval.py
```

---

Now build this! Start with `main.py`, `supabase_client.py`, and a working `/health` endpoint, then implement the full `/query` pipeline with RAG retrieval and confidence scoring.
