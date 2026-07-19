-- ============================================================
-- Persist the "related lessons" widget data alongside the assistant reply
-- that generated it, so the chips survive a panel close/reopen or page
-- reload (previously GET /api/chat reconstructed history as text-only,
-- silently dropping the data-relatedTopics part the live stream emits).
--
-- Nullable, additive-only. Only ever written by the service-role client
-- (assistant rows are never client-writable — see 20260719210000's header
-- note), so no RLS/policy change is needed.
-- ============================================================

alter table public.chat_messages
  add column related_topics jsonb;
