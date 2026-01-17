-- ============================================================================
-- Add public RSVP flag to event attendance
-- ============================================================================
-- Allows attendees to opt in to showing their name publicly on guest lists.
-- ============================================================================

ALTER TABLE public.event_attendance
ADD COLUMN IF NOT EXISTS is_public boolean NOT NULL DEFAULT false;

CREATE INDEX IF NOT EXISTS idx_event_attendance_public
ON public.event_attendance(event_id, is_public);
