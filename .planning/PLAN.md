# Plan: Fix Onboarding Issues

**Phase:** Critical Bug Fixes  
**Estimated Time:** 30-45 minutes  
**Dependencies:** None (can fix in parallel after Issue 3)

---

## Task 1: Fix Schedule Save - Table Name Mismatch 🔴 CRITICAL

<task type="fix">
  <name>Update useSaveSchedule to use correct table name</name>
  <files>hooks/useSaveSchedule.js</files>
  <action>
    1. Replace all instances of `from('sections')` with `from('class_sections')`
    2. Verify column names match schema:
       - Check if `section_code` exists or should be `section_number`
       - Verify `course_id` column name
    3. Check related queries:
       - `section_members` table (line 132) - verify this exists or should be `user_class_enrollments`
       - `section_chats` table (line 185) - verify this exists
    4. Test error handling for PGRST116 (not found) vs other errors
  </action>
  <verify>
    - Schedule save completes without "table not found" error
    - Check Supabase logs for successful INSERT operations
    - Verify sections are created in `class_sections` table
  </verify>
  <done>
    Schedule saves successfully, sections appear in database, forums/chats can be created
  </done>
</task>

---

## Task 2: Fix Picture Picker - Remove Square Crop

<task type="fix">
  <name>Allow full image upload without square cropping</name>
  <files>components/onboarding/steps/PhotoSelectionStep.jsx</files>
  <action>
    1. Modify `processImage()` function (lines 44-77):
       - Remove square crop logic (lines 56-66)
       - Keep resize to max width 800px for performance
       - Maintain aspect ratio
    2. Update `handleSelectYearbookPhoto()` (lines 80-115):
       - Remove `allowsEditing: true` or set to `false`
       - Remove `aspect: [1, 1]` constraint
    3. Update `handleSelectGalleryPhotos()` (lines 118-154):
       - Remove square crop from `processImage()` call
       - Keep quality compression
    4. Update preview styling if needed to handle non-square images
  </action>
  <verify>
    - User can select full image from gallery
    - Image uploads without cropping
    - Preview shows full image (may need aspect ratio handling)
  </verify>
  <done>
    Users can upload full photos without forced square cropping
  </done>
</task>

---

## Task 3: Improve Day Selection Visibility

<task type="fix">
  <name>Enhance day button contrast and selection state</name>
  <files>components/onboarding/steps/ScheduleEditStep.tsx</files>
  <action>
    1. Update `dayChip` style (lines 664-671):
       - Increase border contrast: change `#E8E8E8` to `#D0D0D0` or `#C0C0C0`
       - Consider subtle background: `#F8F8F8` instead of transparent white
    2. Update `dayChipText` style (lines 681-685):
       - Darken unselected text: change `#999` to `#666` or `#4A4A4A`
       - Increase font weight if needed: `'700'` instead of `'600'`
    3. Ensure `dayChipSelected` has strong contrast:
       - Verify primary color is visible
       - Check shadow/elevation is noticeable
    4. Test on both light and dark backgrounds if theme supports it
  </action>
  <verify>
    - Unselected days are clearly visible (dark text, visible border)
    - Selected days are clearly distinct (primary color background + white text)
    - Good contrast ratio for accessibility
  </verify>
  <done>
    Day selection is clearly visible, users can easily see selected vs unselected states
  </done>
</task>

---

## Task 4: Verify Sidebar Updates After Schedule Save

<task type="verify">
  <name>Confirm sidebar shows classes/forums after schedule save</name>
  <files>app/_layout.tsx, hooks/useSaveSchedule.js</files>
  <action>
    1. After Task 1 completes, verify:
       - Forums are created in database (check `forums` table)
       - `useForums()` hook queries correctly (line 75 in _layout.tsx)
       - Forum type filter works: `f.type === 'class'` (line 95)
    2. Check query invalidation (line 212 in useSaveSchedule.js):
       - `queryClient.invalidateQueries({ queryKey: ['forums'] })` should refresh sidebar
    3. Verify chat creation (lines 177-202):
       - `section_chats` table exists
       - User is added to `chat_participants`
    4. Test full flow:
       - Complete onboarding with schedule
       - Check sidebar shows class forums
       - Verify chats appear in messaging
  </action>
  <verify>
    - Sidebar displays class forums after onboarding
    - Chats are accessible
    - Query invalidation refreshes UI automatically
  </verify>
  <done>
    Sidebar correctly displays classes/forums after schedule save, chats are accessible
  </done>
</task>

---

## Notes

- **Task 1 is blocking** - Must complete before Task 4 can be verified
- Tasks 2 and 3 are independent and can be done in parallel
- After Task 1, test full onboarding flow to verify all fixes work together
- Check database schema in Supabase to confirm exact table/column names before fixing Task 1
