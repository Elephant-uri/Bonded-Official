# Supabase Migration History

**Last verified:** January 29, 2026 (via MCP)

## Current Supabase migrations (from MCP)

These are the migrations present in the Supabase project migration history:

- 20260124205159 — fix_messaging_system_complete
- 20260125012250 — auto_manage_org_member_access
- 20260125022412 — fix_org_forum_creation_trigger
- 20260125022448 — add_unique_constraint_forums_org_id
- 20260125022522 — update_org_forum_trigger_with_conflict_handling
- 20260127194927 — add_org_post_storage_policy
- 20260127194944 — add_org_id_to_posts
- 20260127195822 — add_org_post_to_media_type_constraint
- 20260127230739 — message_request_accepted_notification
- 20260127230926 — event_likes_table
- 20260129075437 — add_friends_visibility_and_friend_list_rpcs
- 20260129175210 — fix_friend_rpcs_bypass_rls
- 20260129180425 — fix_get_profile_friends_ambiguous_id

## Repo migration artifacts

The repository contains SQL scripts under `database/`:

- `database/check-messaging-setup.sql`
- `database/enable-messaging-realtime.sql`
- `database/fix-messaging-complete.sql`
- `database/fix-messaging-realtime.sql`
- `database/messaging-core-setup.sql`
- `database/test-messaging-setup.sql`

These scripts are not guaranteed to be part of the tracked Supabase migration history.

## Expected baseline (manual)

This project already has core tables (profiles, forums, posts, messages, etc.) in production, but the
migration history only lists recent changes. That implies historical baseline migrations were either
applied outside the tracked migration system or not recorded.

**Action:** capture a formal baseline by exporting the current schema or by backfilling a “baseline”
migration that represents the current database state.

## Maintenance checklist

- Keep this file in sync after every production migration.
- If a migration is applied manually (SQL editor), add a note here and backfill into the history later.
- Before release, compare MCP migration list with repository SQL files and expected schema.
