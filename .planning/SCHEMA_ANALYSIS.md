# Schema Analysis - Table Name Mismatch

## Current State

### useSaveSchedule.js (BROKEN)
- Uses: `sections` table ❌
- Uses: `courses` table
- Uses: `section_members` table
- Uses: `section_chats` table
- Column: `course_id`
- Column: `section_code`

### useClassMatching.js (WORKING)
- Uses: `class_sections` table ✅
- Uses: `classes` table
- Uses: `user_class_enrollments` table
- Column: `class_id`
- Column: `professor_name`, `semester`, `days_of_week`, etc.

## Questions to Resolve

1. **Are `courses` and `classes` the same table?**
   - `useSaveSchedule` creates `courses` with `subject_code` + `course_number`
   - `useClassMatching` uses `classes` with `class_code` + `class_name`
   - Need to verify which is correct

2. **What is the correct enrollment table?**
   - `section_members` (used in useSaveSchedule)
   - `user_class_enrollments` (used in useClassMatching and useForums)

3. **What columns does `class_sections` have?**
   - `useClassMatching` uses: `class_id`, `professor_name`, `semester`, `days_of_week`, `start_time`, `end_time`, `location`
   - `useSaveSchedule` expects: `course_id`, `section_code`
   - These don't match!

## Hypothesis

There are TWO different schema approaches:
1. **Old approach** (useSaveSchedule): `courses` → `sections` → `section_members`
2. **New approach** (useClassMatching): `classes` → `class_sections` → `user_class_enrollments`

The onboarding flow is using the OLD schema that doesn't exist anymore.

## Fix Strategy

**Option A: Update useSaveSchedule to match working schema**
- Change `sections` → `class_sections`
- Change `courses` → `classes` (verify table exists)
- Change `section_members` → `user_class_enrollments`
- Update column names to match `class_sections` schema

**Option B: Verify actual database schema**
- Check Supabase for actual table names
- Align code to match reality

## Recommendation

Start with Option B - verify actual schema, then update useSaveSchedule to match the working pattern from useClassMatching.
