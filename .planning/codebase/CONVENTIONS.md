# Coding Conventions

**Analysis Date:** 2026-01-13

## Code Style

**Indentation & Formatting:**
- 2-space indentation (consistent throughout)
- Semicolons always used at end of statements
- Single quotes (`'`) in JS/JSX code
- Double quotes (`"`) in JSON config files
- Strategic spacing between logical sections

**Import Organization:**
- External dependencies first
- Then internal modules
- Blank line between groups

Example from `contexts/MessagesContext.jsx`:
```javascript
import React, { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react'
import { Alert } from 'react-native'

import { supabase } from '../lib/supabase'
import { useAuthStore } from '../stores/authStore'
import { moderateMessage as moderateMessageService } from '../services/messageModeration'
```

## Naming Conventions

**Files:**
- React Components: `PascalCase.jsx` (e.g., `AppTopBar.jsx`, `BottomNav.jsx`)
- Custom Hooks: `camelCase.js` with `use` prefix (e.g., `usePosts.js`, `useMessages.js`)
- Services: `camelCase.js` (e.g., `mediaStorage.js`, `featureGates.js`)
- Stores: `camelCase.js` with `Store` suffix (e.g., `authStore.js`)
- Config Files: `kebab-case` (e.g., `jest.config.js`, `tsconfig.json`)
- Page Components: `kebab-case.jsx` (e.g., `create-forum.jsx`, `rate-professor.jsx`)

**Variables:**
- State variables: descriptive camelCase (e.g., `isLoading`, `showEditModal`)
- Boolean prefixes: `is`, `show`, `has` (e.g., `isAuthenticated`, `showFriendsModal`)
- Database fields: snake_case (e.g., `user_id`, `created_at`, `full_name`)
- Local constants: UPPER_SNAKE_CASE (e.g., `BONDED_MEDIA_BUCKET`, `DEFAULT_SIGNED_URL_TTL`)

**Functions:**
- Query functions: `useQuery` pattern (e.g., `useCurrentUserProfile()`)
- Helper functions: descriptive verbs (e.g., `normalizeProfilePhotos()`, `isRlsRecursionError()`)
- Event handlers: `on` + action (e.g., `onPressProfile`, `handleBack`)
- Async functions: clear async nature (e.g., `createEvent()`, `getUniversityIdForUser()`)

## Export Patterns

**Named Exports (preferred for utilities):**
```javascript
export function useCurrentUserProfile() { ... }
export const FEATURE_GATES = { ... }
export async function createEvent(input) { ... }
```

**Default Exports (for components):**
```javascript
export default AppTopBar
export default function ForumScreen() { ... }
```

## Component Patterns

**Functional Components:**
```javascript
const ComponentName = ({ prop1, prop2 }) => {
  const [state, setState] = useState(initialValue)

  // Hooks first
  const { data } = useQuery()

  // Callbacks
  const handlePress = useCallback(() => { ... }, [deps])

  // Effects
  useEffect(() => { ... }, [deps])

  return (
    <View>
      {/* JSX */}
    </View>
  )
}

export default ComponentName
```

**Hook Pattern:**
```javascript
export function useFeature(param) {
  return useQuery({
    queryKey: ['feature', param],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('table')
        .select('*')

      if (error) throw error
      return data
    },
    enabled: !!param,
  })
}
```

## Documentation Style

**JSDoc Comments (for public functions):**
```javascript
/**
 * Check if a feature is enabled
 * @param {string} featureName - Name of the feature to check
 * @returns {boolean} - True if feature is enabled, false otherwise
 */
export const isFeatureEnabled = (featureName) => {
  return FEATURE_GATES[featureName] === true
}
```

**File-level Documentation:**
```javascript
/**
 * MessagesContext - Real-time messaging with Supabase
 *
 * Architecture:
 * 1. Messages: Stored in DB, real-time via Postgres Changes
 * 2. Typing indicators: Ephemeral, via Broadcast
 * 3. Online status: Via Presence
 */
```

**Section Headers (for large files):**
```javascript
// ============================================================================
// CONVERSATIONS
// ============================================================================
```

**Inline Comments:**
```javascript
// Check if string is a valid UUID
const isValidUUID = (str) => { ... }

// For graceful fallback when table doesn't exist
const isTableNotFoundError = (error) => { ... }
```

**Emoji Usage in Logs:**
```javascript
console.log('✅ ML Kit Text Recognition is available')
console.log('⚠️ ML Kit not available (likely running in Expo Go)')
```

## State Management Patterns

**Zustand Store:**
```javascript
import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import AsyncStorage from '@react-native-async-storage/async-storage'

export const useAuthStore = create(
  persist(
    (set) => ({
      user: null,
      session: null,
      setUser: (user) => set({ user }),
      logout: () => set({ user: null, session: null }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
)
```

**React Query Hook:**
```javascript
export function usePosts(forumId) {
  return useInfiniteQuery({
    queryKey: ['posts', forumId],
    queryFn: async ({ pageParam = 0 }) => {
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .eq('forum_id', forumId)
        .range(pageParam, pageParam + 19)

      if (error) throw error
      return data
    },
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 20 ? pages.length * 20 : undefined,
    enabled: !!forumId,
  })
}
```

## Error Handling Patterns

**In Hooks:**
```javascript
const isRlsRecursionError = (error) => {
  return error?.code === '42P17' || error?.message?.includes('infinite recursion')
}

if (isRlsRecursionError(error)) {
  // Graceful fallback
  return []
}
```

**In Components:**
```javascript
try {
  const result = await asyncOperation()
  // Handle success
} catch (error) {
  console.error('Operation failed:', error)
  Alert.alert('Error', 'Something went wrong')
}
```

## Styling Patterns

**React Native StyleSheet:**
```javascript
const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  title: {
    fontSize: hp(2.5),
    fontWeight: '600',
    color: theme.colors.text,
  },
})
```

**Responsive Sizing:**
```javascript
import { hp, wp } from '../helpers/common'

// hp = height percentage, wp = width percentage
fontSize: hp(2.5),  // 2.5% of screen height
width: wp(90),      // 90% of screen width
```

## TypeScript Usage

**Mixed Codebase:**
- `.js` files: Plain JavaScript with JSDoc types
- `.jsx` files: React components
- `.ts` files: TypeScript utilities (e.g., `utils/ocr/extractText.ts`)
- `.tsx` files: TypeScript React components

**Path Aliases:**
```json
// tsconfig.json
{
  "compilerOptions": {
    "paths": {
      "@/*": ["./*"]
    }
  }
}
```

---

*Conventions analysis: 2026-01-13*
*Update when coding standards change*
