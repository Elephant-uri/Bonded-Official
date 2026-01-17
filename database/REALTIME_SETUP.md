# Real-time Messaging Setup for Supabase

## ⚠️ IMPORTANT: Run This SQL Script First!

To enable real-time messaging and typing indicators, you **MUST** run the SQL script in Supabase:

### Steps:

1. **Open Supabase Dashboard** → Go to your project
2. **Navigate to SQL Editor**
3. **Run the script**: `database/enable-realtime-messaging.sql`

This script will:
- ✅ Add `messages` table to real-time publication
- ✅ Add `conversations` table to real-time publication  
- ✅ Add `conversation_participants` table to real-time publication
- ✅ Set `REPLICA IDENTITY FULL` on messages table (required for real-time)

### What This Does:

**Real-time Publication:**
- Supabase uses PostgreSQL's logical replication
- Tables must be explicitly added to the `supabase_realtime` publication
- This allows Postgres Changes subscriptions to work

**REPLICA IDENTITY FULL:**
- Required for tables that need to send full row data in real-time
- Without this, real-time subscriptions may not receive all message data
- This is why messages weren't showing up in real-time!

### Verify It Worked:

After running the script, you should see:
```
✅ Added messages table to realtime publication
✅ Set REPLICA IDENTITY FULL on messages table
```

### Alternative: Manual Setup in Dashboard

If you prefer using the UI:

1. Go to **Database** → **Replication**
2. Enable replication for:
   - `messages`
   - `conversations`
   - `conversation_participants`

However, you'll still need to run the SQL to set `REPLICA IDENTITY FULL` on the messages table.

---

## Broadcast Channels (Typing Indicators)

Broadcast channels work automatically once real-time is enabled. No additional setup needed!

The typing indicators use Supabase's Broadcast API, which:
- ✅ Works out of the box with real-time enabled
- ✅ Doesn't require database replication
- ✅ Is ephemeral (not stored in database)

---

## Troubleshooting

### Messages not appearing in real-time:
1. ✅ Run `enable-realtime-messaging.sql`
2. ✅ Check that RLS policies allow SELECT on messages
3. ✅ Verify subscription status in console logs (should show "SUBSCRIBED")

### Typing indicators not working:
1. ✅ Check console logs for broadcast channel status
2. ✅ Verify both users are subscribed to the same channel
3. ✅ Check that `broadcast: { self: false }` is set (industry standard)

### Still not working?
- Check Supabase project settings → ensure real-time is enabled
- Check network tab for WebSocket connections
- Look for errors in console logs

