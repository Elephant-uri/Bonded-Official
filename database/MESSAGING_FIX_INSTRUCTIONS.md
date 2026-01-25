# Messaging System Fix Instructions

Your messaging system isn't working because of database configuration issues. Follow these steps to fix it.

## Problems Identified

1. **Missing columns**: `org_id` and `class_section_id` columns in `conversations` table
2. **Missing RPC function**: `find_or_create_direct_chat` (your app calls this, but it doesn't exist)
3. **Incomplete RLS policies**: Some policies needed for cross-user chat creation
4. **Realtime not fully enabled**: May not be enabled for all messaging tables

## How to Fix

### Step 1: Run the Core Setup (if tables don't exist yet)

If your messaging tables don't exist at all, first run:

```sql
-- In Supabase SQL Editor, run:
database/messaging-core-setup.sql
```

### Step 2: Apply the Complete Fix

Run this SQL script in your Supabase SQL Editor:

```sql
-- In Supabase SQL Editor, run:
database/fix-messaging-complete.sql
```

This will:
- Add missing columns to the conversations table
- Create the `find_or_create_direct_chat` RPC function
- Fix all RLS policies
- Enable realtime for all messaging tables
- Create necessary triggers and indexes

### Step 3: Verify the Fix

Run the verification script to make sure everything is set up correctly:

```sql
-- In Supabase SQL Editor, run:
database/test-messaging-setup.sql
```

Look for ✅ symbols. If you see any ❌, something went wrong - re-run Step 2.

### Step 4: Test in Your App

1. Restart your app
2. Try sending a direct message to another user
3. Check if messages appear in real-time
4. Try creating a group chat

## Accessing Supabase SQL Editor

1. Go to https://supabase.com/dashboard
2. Select your project: `ptilskwpvvltrvrusiva`
3. Click on "SQL Editor" in the left sidebar
4. Click "New Query"
5. Copy and paste the SQL from the files mentioned above
6. Click "Run"

## Still Having Issues?

If messaging still doesn't work after following these steps, check:

1. **Browser console errors**: Open DevTools (F12) and check the Console tab
2. **Network errors**: Check the Network tab for failed requests
3. **Authentication**: Make sure users are properly authenticated
4. **Profiles table**: Verify that users have entries in the `profiles` table

### Common Errors and Solutions

**"infinite recursion detected in policy for relation"**
- Re-run `fix-messaging-complete.sql` - it has updated RLS policies that prevent recursion

**"new row violates row-level security policy"**
- Make sure the user is authenticated (`auth.uid()` returns a value)
- Verify the user exists in the `profiles` table

**"relation 'conversations' does not exist"**
- First run `messaging-core-setup.sql` to create tables

**Messages don't appear in real-time**
- Check that realtime is enabled (Step 3 verification)
- Check browser console for subscription errors
- The app will fall back to polling if realtime fails

## What This Fix Does

### Database Schema Changes
- Adds `org_id` column to support organization chats
- Adds `class_section_id` column to support class chats
- Updates type constraint to include 'class' type

### RPC Functions Created
- `find_or_create_direct_chat(user1_id, user2_id)`: Creates or finds a direct conversation
- `find_direct_conversation(user1, user2)`: Finds existing direct conversation (for compatibility)
- `get_conversation_participants(conv_id)`: Gets all participants in a conversation

### RLS Policies Fixed
- Users can view conversations they participate in
- Users can insert conversations they create
- Users can add participants to conversations they create
- Users can view messages in conversations they're part of
- Users can insert messages in their conversations
- Users can update/delete their own messages

### Realtime Enabled
- `messages` table: Real-time message delivery
- `conversations` table: Real-time conversation updates
- `conversation_participants` table: Real-time participant changes

## Architecture Overview

Your messaging system uses:
- **React Query** for data fetching and caching (`useMessages`, `useConversations`, `useSendMessage`)
- **Supabase Realtime** for live message updates
- **Row Level Security (RLS)** for data access control
- **Polling fallback** if realtime fails

The app will work even if realtime isn't enabled, but messages won't appear instantly.
