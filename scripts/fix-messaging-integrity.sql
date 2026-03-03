-- Repairs messaging integrity issues where message senders are not participants
-- in the referenced conversation.
--
-- Run in Supabase SQL editor in a maintenance window.

begin;

-- 1) Backfill missing sender participants so message history remains accessible.
insert into public.conversation_participants (conversation_id, user_id, last_read_at)
select distinct
  m.conversation_id,
  m.sender_id,
  m.created_at
from public.messages m
left join public.conversation_participants cp
  on cp.conversation_id = m.conversation_id
 and cp.user_id = m.sender_id
where cp.conversation_id is null
  and m.conversation_id is not null
  and m.sender_id is not null;

-- 2) Normalize per-user read markers from existing messages when missing.
update public.conversation_participants cp
set last_read_at = coalesce(
  cp.last_read_at,
  (
    select max(m.created_at)
    from public.messages m
    where m.conversation_id = cp.conversation_id
      and m.sender_id = cp.user_id
  )
)
where cp.last_read_at is null;

commit;
