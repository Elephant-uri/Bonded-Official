# Current State - Onboarding Fixes

**Date:** January 2026  
**Status:** 🔴 Critical Issues Identified  
**Context:** Onboarding flow has 4 blocking issues preventing schedule saves and proper UX

## Current Issues

### Issue 1: Picture Picker - Square Crop
- **Location:** `components/onboarding/steps/PhotoSelectionStep.jsx`
- **Problem:** Images are cropped to square (800x800) instead of uploading full image
- **Impact:** Users can't upload full photos, only cropped squares
- **Priority:** Medium (UX issue)

### Issue 2: Day Selection Visibility
- **Location:** `components/onboarding/steps/ScheduleEditStep.tsx`
- **Problem:** Days of week buttons have poor contrast - unselected state too light (#999 text on white)
- **Impact:** Users can't tell which days are selected
- **Priority:** Medium (UX issue)

### Issue 3: Schedule Not Saving - Wrong Table Name ⚠️ BLOCKING
- **Location:** `hooks/useSaveSchedule.js` lines 68-99
- **Problem:** Code queries `from('sections')` but database table is `class_sections`
- **Error:** `"Could not find the table 'public.sections' in the schema cache"`
- **Impact:** **CRITICAL** - Schedules never save, no forums/chats created, sidebar empty
- **Priority:** 🔴 **HIGHEST** - Blocks all schedule functionality

### Issue 4: Sidebar Not Showing Classes/Forums
- **Location:** `app/_layout.tsx` + `hooks/useSaveSchedule.js`
- **Problem:** Sidebar queries forums but they're not created because Issue 3 blocks schedule save
- **Impact:** Users don't see their classes in sidebar after onboarding
- **Priority:** High (but depends on Issue 3 fix)

## Root Cause Analysis

**Primary Blocker:** Issue 3 - Table name mismatch
- `useSaveSchedule.js` uses `sections` table
- Actual database table is `class_sections` (per TECHNICAL_DOCUMENTATION.md line 359)
- `useClassMatching.js` correctly uses `class_sections` (line 86)
- This inconsistency suggests incomplete migration or copy-paste error

## Fix Order

1. **Fix Issue 3 FIRST** - Unblocks everything else
2. Fix Issue 1 - Picture picker (independent)
3. Fix Issue 2 - Day visibility (independent)
4. Verify Issue 4 resolves after Issue 3 fix

## Technical Context

- Database: Supabase (PostgreSQL)
- Schema: `class_sections` table exists (deployed per tech doc)
- Related tables: `section_members`, `section_chats`, `forums`
- Need to verify column names match after table name fix
