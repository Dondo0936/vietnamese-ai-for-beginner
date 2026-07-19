-- ============================================================
-- Chatbot persistence: chat_messages table + atomic turn reservation.
--
-- Writes are RPC-only, not RLS-INSERT-permissive — mirrors the hardening
-- applied to user_progress in 202604180001_harden_user_progress.sql after
-- a prior incident where a client-writable INSERT policy let the browser
-- stuff arbitrary rows in directly. Here specifically: a plain
-- "auth.uid() = user_id AND role = 'user'" INSERT policy would let a
-- client bypass the Next.js /api/chat route's classifier and the anonymous
-- turn-cap entirely by calling PostgREST directly. So all user-role writes
-- go through chat_reserve_user_turn() (SECURITY DEFINER, atomic
-- count+cap-check+insert under an advisory lock). Assistant-role rows are
-- written by the server's service-role client, which bypasses RLS by
-- design and is never exposed to the browser.
-- ============================================================

create table public.chat_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  role text not null check (role in ('user', 'assistant')),
  content text not null check (char_length(content) <= 8000),
  blocked boolean not null default false,
  created_at timestamptz not null default now()
);

create index chat_messages_user_id_created_at_idx
  on public.chat_messages (user_id, created_at);

alter table public.chat_messages enable row level security;

create policy "Users can read own chat messages"
  on public.chat_messages for select
  using (auth.uid() = user_id);

-- No INSERT/UPDATE/DELETE policy for anon/authenticated — see header note.
revoke insert, update, delete on table public.chat_messages from anon, authenticated;

-- ---------- Atomic, cap-enforced user-turn reservation ----------
--
-- Anonymous visitors get p_anon_cap on-topic turns (lifetime); off-topic
-- (blocked) messages never count against that cap. Signed-in users get a
-- rolling p_daily_cap turns per 24h (blocked messages DO count here — this
-- is a cost/abuse guard, not a topic gate). pg_advisory_xact_lock makes the
-- count-then-insert atomic per user, closing the race where two concurrent
-- requests both read count < cap and both get admitted.
--
-- is_anonymous is derived from the caller's own JWT claim, not a caller-
-- supplied parameter — the Next.js route can't misreport it even by bug.

create or replace function public.chat_reserve_user_turn(
  p_content text,
  p_blocked boolean,
  p_anon_cap int default 2,
  p_daily_cap int default 100
) returns public.chat_messages
language plpgsql
security definer
set search_path = public
as $$
declare
  v_row public.chat_messages;
  v_count int;
  v_is_anonymous boolean;
begin
  if auth.uid() is null then
    raise exception 'not authenticated';
  end if;
  if p_content is null or char_length(p_content) = 0 or char_length(p_content) > 2000 then
    raise exception 'invalid content length';
  end if;

  v_is_anonymous := coalesce((auth.jwt() ->> 'is_anonymous')::boolean, false);

  perform pg_advisory_xact_lock(hashtext(auth.uid()::text));

  if v_is_anonymous and not p_blocked then
    select count(*) into v_count from public.chat_messages
      where user_id = auth.uid() and role = 'user' and blocked = false;
    if v_count >= p_anon_cap then
      raise exception 'anon_cap_exceeded';
    end if;
  elsif not v_is_anonymous then
    select count(*) into v_count from public.chat_messages
      where user_id = auth.uid() and role = 'user' and created_at > now() - interval '1 day';
    if v_count >= p_daily_cap then
      raise exception 'daily_cap_exceeded';
    end if;
  end if;

  insert into public.chat_messages (user_id, role, content, blocked)
  values (auth.uid(), 'user', p_content, p_blocked)
  returning * into v_row;

  return v_row;
end;
$$;

revoke execute on function public.chat_reserve_user_turn(text, boolean, int, int) from public, anon;
grant execute on function public.chat_reserve_user_turn(text, boolean, int, int) to authenticated;
