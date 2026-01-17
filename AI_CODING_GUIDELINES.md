# AI Coding Guidelines for Bonded

This document serves as a reference for AI assistants working on this codebase. It captures established patterns, best practices, and conventions to ensure consistency and quality.

## Table of Contents
1. [Profile Pictures & User Interactions](#profile-pictures--user-interactions)
2. [Avoiding Redundancies](#avoiding-redundancies)
3. [Supabase Integration Patterns](#supabase-integration-patterns)
4. [Component Structure & Patterns](#component-structure--patterns)
5. [UI/UX Patterns](#uiux-patterns)
6. [State Management](#state-management)
7. [Error Handling](#error-handling)

---

## Profile Pictures & User Interactions

### ✅ **ALWAYS Make Profile Pictures Clickable (Unless Anonymous)**

**Pattern:**
- Profile avatars should be clickable to view user profiles
- Anonymous users should NOT be clickable (no profile to view)
- Use `TouchableOpacity` wrapper around avatar components
- Pass `onPressProfile` callback that accepts `userId` and `isAnon` boolean

**Example:**
```jsx
// Avatar component with clickability
const PostAvatar = ({ post, size, theme, onPress }) => {
    const avatarContent = () => {
        // ... avatar rendering logic
    }

    if (onPress && !post.isAnon) {
        return (
            <TouchableOpacity onPress={onPress} activeOpacity={0.7}>
                {avatarContent()}
            </TouchableOpacity>
        )
    }

    return avatarContent()
}

// Usage in post/comment components
<PostAvatar 
    post={post} 
    theme={theme}
    onPress={() => !post.isAnon && post.userId && onPressProfile?.(post.userId, post.isAnon)}
/>

// In parent component
onPressProfile={(userId, isAnon) => {
    if (isAnon) return // No profile for anonymous
    setActiveProfileId(userId) // Opens profile modal
}}
```

**Key Points:**
- Check `isAnon` before making clickable
- Always pass `userId` in post/comment data structures
- Use `activeOpacity={0.7}` for consistent touch feedback
- Profile modal should handle anonymous users gracefully

---

## Avoiding Redundancies

### ✅ **Single Source of Truth for Actions**

**Pattern:**
- Each action should appear ONCE per context
- Remove duplicate buttons (e.g., don't have two share buttons)
- Remove unused/non-functional buttons (e.g., three dots that do nothing)
- Keep action bars clean and purposeful

**Example - Action Bar:**
```jsx
// ❌ BAD - Multiple share buttons, unused buttons
<TouchableOpacity onPress={onShare}>
    <Ionicons name="paper-plane-outline" />
</TouchableOpacity>
<TouchableOpacity onPress={onShare}>
    <Ionicons name="share-outline" />
</TouchableOpacity>
<TouchableOpacity>
    <Ionicons name="ellipsis-horizontal" /> {/* Does nothing */}
</TouchableOpacity>

// ✅ GOOD - Single share button, only functional actions
<TouchableOpacity onPress={onShare} activeOpacity={0.7}>
    <Ionicons name="share-outline" />
</TouchableOpacity>
<TouchableOpacity>
    <Ionicons name="chatbubble-outline" />
    {commentsCount > 0 && <Text>{commentsCount}</Text>}
</TouchableOpacity>
```

**Key Points:**
- One button per action type
- Remove buttons that don't have functionality
- If functionality is planned, add a TODO comment instead of leaving dead code

---

## Supabase Integration Patterns

### ✅ **Proper Table Names & Column Mapping**

**Pattern:**
- Always verify table names match database schema
- Use correct column names (check `TECHNICAL_DOCUMENTATION.md`)
- Handle RLS (Row Level Security) errors gracefully
- Use `.maybeSingle()` for optional queries
- Use `.single()` when exactly one result is expected

**Common Table Names:**
```javascript
// ✅ CORRECT table names
'class_sections'      // NOT 'sections'
'classes'             // NOT 'courses'
'user_class_enrollments'  // NOT 'section_members'
'forums'              // Forum data
'conversations'       // Chat/group conversations
'conversation_participants'  // Chat members
'forum_comments'      // Post comments
'forum_comment_reactions'  // Comment votes
'posts'               // Forum posts
'post_reactions'      // Post votes

// ❌ WRONG - These don't exist
'sections'
'courses'
'section_members'
'orgs'  // Use 'org_members' or check actual table name
```

**Example - Proper Query Pattern:**
```javascript
// ✅ GOOD - Proper error handling and table names
const { data: existingForum } = await supabase
  .from('forums')
  .select('id')
  .eq('university_id', universityId)
  .eq('name', course.courseCode.trim())
  .eq('type', 'class')
  .maybeSingle()  // Use maybeSingle for optional results

if (!existingForum) {
  const { error: forumError } = await supabase
    .from('forums')
    .insert({
      name: course.courseCode.trim(),
      type: 'class',
      university_id: universityId,
      description: `Forum for ${course.courseCode.trim()}`,
      is_public: false,
    })

  if (forumError && forumError.code !== '23505') {
    // Ignore duplicate errors (race condition)
    console.error('Error creating class forum:', forumError)
  }
}
```

**Error Handling Pattern:**
```javascript
// Handle PGRST205 errors (table not found)
if (error?.code === 'PGRST205') {
  console.warn('Table not found:', error.message)
  return [] // Return empty array instead of crashing
}

// Handle duplicate key errors (23505)
if (error?.code === '23505') {
  // Duplicate entry - usually safe to ignore
  return
}

// Handle other errors
if (error) {
  console.error('Database error:', error)
  // Show user-friendly error or return gracefully
}
```

### ✅ **Forum & Chat Creation Patterns**

**Pattern:**
- Create forums for classes (one per course at university)
- Create group conversations for sections (one per section)
- Check for existing records before creating
- Handle race conditions (multiple users creating simultaneously)
- Add users to existing forums/chats if they already exist

**Example:**
```javascript
// 1. Ensure class forum exists (for sidebar visibility)
const { data: existingForum } = await supabase
  .from('forums')
  .select('id')
  .eq('university_id', universityId)
  .eq('name', course.courseCode.trim())
  .eq('type', 'class')
  .maybeSingle()

if (!existingForum) {
  // Create forum if it doesn't exist
  const { error: forumError } = await supabase
    .from('forums')
    .insert({ /* forum data */ })
  
  // Ignore duplicate errors (race condition)
  if (forumError && forumError.code !== '23505') {
    console.error('Error creating forum:', forumError)
  }
}

// 2. Create or join section chat
const chatName = `${course.courseCode.trim()} Section ${course.sectionId}`
const { data: existingConv } = await supabase
  .from('conversations')
  .select('id')
  .eq('type', 'group')
  .eq('name', chatName)
  .maybeSingle()

let conversationId
if (existingConv) {
  conversationId = existingConv.id
  // Add user to existing chat
  await supabase
    .from('conversation_participants')
    .insert({ conversation_id: conversationId, user_id: user.id })
    // Ignore duplicate errors
} else {
  // Create new chat
  const { data: newConv } = await supabase
    .from('conversations')
    .insert({ name: chatName, type: 'group', created_by: user.id })
    .select('id')
    .single()
  
  conversationId = newConv.id
  // Add creator as participant
}
```

---

## Component Structure & Patterns

### ✅ **Scrollable Content Patterns**

**Pattern:**
- Headers should scroll WITH content, not be fixed overlays
- Use `FlatList` `ListHeaderComponent` for headers that scroll
- Avoid fixed headers that cover content
- Use `SafeAreaView` for proper insets

**Example:**
```jsx
// ❌ BAD - Fixed header covers content
<SafeAreaView>
  <View style={styles.fixedHeader}>
    <BackButton />
  </View>
  <FlatList data={items} />
</SafeAreaView>

// ✅ GOOD - Header scrolls with content
<SafeAreaView>
  <FlatList
    data={items}
    ListHeaderComponent={() => (
      <>
        <View style={styles.header}>
          <BackButton />
        </View>
        <PostContent />
      </>
    )}
  />
</SafeAreaView>
```

### ✅ **Reply/Comment Threading**

**Pattern:**
- Use `parent_id` for threaded comments
- Show "Replying to [user]" banner when replying
- Update input placeholder when replying
- Pass `parentId` to comment submission function
- Clear reply state after submission

**Example:**
```jsx
const [replyingTo, setReplyingTo] = useState(null)

// In comment item
<TouchableOpacity onPress={() => setReplyingTo(comment)}>
  <Text>Reply</Text>
</TouchableOpacity>

// In input area
{replyingTo && (
  <View style={styles.replyingBanner}>
    <Text>Replying to {replyingTo.author}</Text>
    <TouchableOpacity onPress={() => setReplyingTo(null)}>
      <Ionicons name="close" />
    </TouchableOpacity>
  </View>
)}

<TextInput
  placeholder={replyingTo ? `Reply to ${replyingTo.author}...` : "Add a comment..."}
/>

// On submit
await onAddComment(postId, body, isAnon, replyingTo?.id)
setReplyingTo(null)
```

---

## UI/UX Patterns

### ✅ **Dynamic Styling for Different Screen Sizes**

**Pattern:**
- Use `useSafeAreaInsets()` for dynamic padding
- Use `hp()` and `wp()` helpers for responsive sizing
- Add `hitSlop` to small touch targets
- Use `minWidth`/`minHeight` for touch targets (minimum 44x44 points)

**Example:**
```jsx
const insets = useSafeAreaInsets()

<TouchableOpacity
  style={{
    paddingTop: Math.max(insets.top, hp(1)),
    minWidth: hp(5),
    minHeight: hp(5),
  }}
  hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
  activeOpacity={0.7}
>
  <BackButton />
</TouchableOpacity>
```

### ✅ **Voting UI Patterns**

**Pattern:**
- Use horizontal voting layout (upvote, count, downvote in a row)
- Use `ArrowUpCircle` and `ArrowDownCircle` icons from `components/Icons`
- Show filled icons when voted (green for upvote, red for downvote)
- Update vote count color based on vote state

**Example:**
```jsx
import { ArrowUpCircle, ArrowDownCircle } from '../components/Icons'

<View style={styles.votesRow}>
  <TouchableOpacity onPress={onUpvote}>
    <ArrowUpCircle
      size={hp(2.4)}
      color={isUpvoted ? theme.statusColors.success : theme.colors.textSecondary}
      strokeWidth={2}
      fill={isUpvoted ? '#2ecc71' : 'none'}
    />
  </TouchableOpacity>
  <Text style={[
    styles.voteCount,
    isUpvoted && { color: theme.colors.success },
    isDownvoted && { color: theme.colors.error }
  ]}>
    {score}
  </Text>
  <TouchableOpacity onPress={onDownvote}>
    <ArrowDownCircle
      size={hp(2.4)}
      color={isDownvoted ? theme.statusColors.error : theme.colors.textSecondary}
      strokeWidth={2}
      fill={isDownvoted ? '#e74c3c' : 'none'}
    />
  </TouchableOpacity>
</View>
```

### ✅ **Anonymous Toggle Pattern**

**Pattern:**
- Show "ANON" when anonymous (purple highlight)
- Show "PUBLIC" when not anonymous
- Toggle should be visually distinct
- Use border and background color changes

**Example:**
```jsx
<TouchableOpacity
  style={{
    backgroundColor: isAnon ? theme.colors.bondedPurple + '20' : theme.colors.backgroundSecondary,
    borderColor: isAnon ? theme.colors.bondedPurple : theme.colors.border,
    borderWidth: 1.5,
    paddingHorizontal: wp(3),
    paddingVertical: hp(0.6),
    borderRadius: hp(1.5),
  }}
  onPress={() => setIsAnon(!isAnon)}
>
  <Text style={{
    color: isAnon ? theme.colors.bondedPurple : theme.colors.textSecondary,
    fontWeight: isAnon ? '700' : '600',
  }}>
    {isAnon ? 'ANON' : 'PUBLIC'}
  </Text>
</TouchableOpacity>
```

---

## State Management

### ✅ **React Query Patterns**

**Pattern:**
- Use `useQuery` for fetching data
- Use `useMutation` for creating/updating/deleting
- Use `useQueryClient` for cache invalidation
- Always handle loading and error states

**Example:**
```jsx
const { data, isLoading, error } = useQuery({
  queryKey: ['posts', forumId],
  queryFn: () => fetchPosts(forumId),
  staleTime: 10 * 1000,
})

const mutation = useMutation({
  mutationFn: createPost,
  onSuccess: () => {
    queryClient.invalidateQueries(['posts', forumId])
  },
})
```

---

## Error Handling

### ✅ **Graceful Error Handling**

**Pattern:**
- Never crash the app on errors
- Log errors for debugging
- Show user-friendly messages when appropriate
- Return empty states instead of crashing
- Handle missing tables gracefully

**Example:**
```jsx
try {
  const { data, error } = await supabase.from('table').select()
  
  if (error) {
    if (error.code === 'PGRST205') {
      // Table not found - return empty array
      console.warn('Table not found, returning empty array')
      return []
    }
    throw error
  }
  
  return data || []
} catch (error) {
  console.error('Error:', error)
  // Return safe default instead of crashing
  return []
}
```

---

## Quick Reference Checklist

Before implementing a feature, check:

- [ ] Profile pictures are clickable (unless anonymous)
- [ ] No duplicate buttons/actions
- [ ] Correct Supabase table names (check TECHNICAL_DOCUMENTATION.md)
- [ ] Proper error handling (especially PGRST205)
- [ ] Headers scroll with content (not fixed)
- [ ] Touch targets are at least 44x44 points
- [ ] Using `useSafeAreaInsets()` for dynamic padding
- [ ] Reply functionality uses `parent_id`
- [ ] Voting uses horizontal layout with ArrowUpCircle/ArrowDownCircle
- [ ] Anonymous toggle is visually distinct
- [ ] React Query for data fetching
- [ ] Graceful error handling (no crashes)

---

## Additional Resources

- `TECHNICAL_DOCUMENTATION.md` - Database schema and API details
- `app/forum.jsx` - Reference implementation for forum features
- `components/Forum/ForumPostDetail.jsx` - Reference for post detail patterns
- `hooks/useSaveSchedule.js` - Reference for Supabase integration patterns

---

**Last Updated:** 2024
**Maintained By:** Development Team
