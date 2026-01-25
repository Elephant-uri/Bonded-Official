# Deployment Guide: Organization & Forum Fixes

This guide outlines the steps to deploy the fixes for the three critical issues identified in the Bonded app.

## 📋 Issues Fixed

1. **Issue 1**: Organization forum not visible after creation
2. **Issue 2**: User org data persistence after logout/login
3. **Issue 3**: Users cannot request to join or join public organizations

## 🗃️ Database Changes (Run First)

### 1. Deploy Forum Creation Trigger
```sql
-- Run this file in your Supabase SQL editor:
-- /database/fix-org-forum-creation-trigger.sql
```

This creates:
- Database trigger to automatically create forums for new organizations
- Security definer functions to bypass RLS for forum operations
- Proper data integrity guarantees

### 2. Fix RLS Policies
```sql
-- Run this file in your Supabase SQL editor:
-- /database/fix-org-members-rls-policies.sql
```

This creates:
- Simplified, non-recursive RLS policies for org_members table
- Security definer functions for membership operations
- Self-service policies for joining organizations

## 📱 Frontend Changes

### 3. Updated Contexts
- **ClubsContext.jsx**: Now uses security definer functions and has better auth state sync
- **UnifiedForumContext.jsx**: New unified context to solve context isolation
- **app/_layout.tsx**: Updated to include UnifiedForumProvider

### 4. Updated Components
- **ForumSwitcher.jsx**: Now uses unified forum context
- **app/forum.jsx**: Updated to use unified forum management
- **app/clubs/create.jsx**: Better error handling and user feedback

## 🚀 Deployment Steps

### Step 1: Database Migration
1. Go to your Supabase project
2. Navigate to SQL Editor
3. Run `fix-org-forum-creation-trigger.sql`
4. Run `fix-org-members-rls-policies.sql`
5. Verify no errors occurred

### Step 2: Frontend Deployment
1. Deploy the updated code to your app stores
2. Ensure all context providers are properly nested
3. Test the authentication flow

### Step 3: Testing
1. **Test Forum Creation**:
   - Create a new organization
   - Verify forum appears in forum switcher
   - Check that clicking forum switcher shows org forum

2. **Test Auth Persistence**:
   - Create/join an organization
   - Logout and login back
   - Verify organization memberships are preserved

3. **Test Join Requests**:
   - Try to join a public organization
   - Try to request to join a private organization
   - Verify admin notifications work

## 🔍 Verification

### Database Verification
```sql
-- Check trigger exists
SELECT * FROM pg_trigger WHERE tgname = 'on_org_create_forum';

-- Check functions exist
SELECT proname FROM pg_proc WHERE proname LIKE '%org%' OR proname LIKE '%forum%';

-- Check RLS policies
SELECT policyname, tablename FROM pg_policies WHERE tablename = 'org_members';
```

### Frontend Verification
- Check browser console for any errors
- Verify network requests are successful
- Test all user flows mentioned above

## 🚨 Rollback Plan

If issues occur:
1. **Database**: Drop the trigger and restore previous RLS policies
2. **Frontend**: Revert to previous commit
3. **Users**: Clear app cache if needed

## 📞 Support

If you encounter issues:
1. Check Supabase logs for database errors
2. Check browser console for frontend errors
3. Verify all SQL files ran successfully
4. Ensure proper permissions are set

## 🎯 Expected Results

After deployment:
- ✅ Organizations automatically get forums created
- ✅ Forum switcher shows all available forums (main + org)
- ✅ User org memberships persist after logout/login
- ✅ Users can join public orgs and request to join private orgs
- ✅ Better error messages and user feedback
- ✅ More reliable data synchronization

## 🔄 Monitoring

Monitor these metrics post-deployment:
- Organization creation success rate
- Forum creation success rate
- Join request success rate
- User authentication flows
- Error rates in console/logs
