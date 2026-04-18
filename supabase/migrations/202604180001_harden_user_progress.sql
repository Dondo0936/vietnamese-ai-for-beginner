-- ============================================================
-- Harden user_progress against client-controlled writes.
--
-- Context: `src/lib/database.ts` used to `.upsert()` the raw row from the
-- browser, letting any authenticated (incl. anonymous) user stuff arbitrary
-- data into read_topics/bookmarks. The app now calls SECURITY DEFINER RPCs
-- (`add_read_topic`, `toggle_bookmark`) exclusively. This migration:
--   1. Adds slug-format + size CHECKs on the RPC inputs.
--   2. Adds defense-in-depth CHECK constraints on the table columns.
--   3. Revokes direct INSERT/UPDATE/DELETE on `user_progress` from the
--      `authenticated` and `anon` roles — the RPCs run as the function owner
--      and bypass these revokes via SECURITY DEFINER. SELECT stays so RLS-
--      gated reads keep working.
--
-- Apply with:   supabase db push
-- ============================================================

-- ---------- 1. Slug-validated RPCs (replace previous definitions) ----------

CREATE OR REPLACE FUNCTION add_read_topic(topic_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF topic_slug IS NULL OR topic_slug !~ '^[a-z0-9-]{1,80}$' THEN
    RAISE EXCEPTION 'invalid topic_slug';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO user_progress (user_id, read_topics, last_visited, updated_at)
  VALUES (auth.uid(), ARRAY[topic_slug], topic_slug, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    read_topics = CASE
      WHEN topic_slug = ANY(user_progress.read_topics) THEN user_progress.read_topics
      WHEN cardinality(user_progress.read_topics) >= 1000 THEN user_progress.read_topics
      ELSE array_append(user_progress.read_topics, topic_slug)
    END,
    last_visited = topic_slug,
    updated_at = NOW();
END;
$$;

CREATE OR REPLACE FUNCTION toggle_bookmark(topic_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  is_bookmarked BOOLEAN;
  bookmark_count INT;
BEGIN
  IF topic_slug IS NULL OR topic_slug !~ '^[a-z0-9-]{1,80}$' THEN
    RAISE EXCEPTION 'invalid topic_slug';
  END IF;
  IF auth.uid() IS NULL THEN
    RAISE EXCEPTION 'not authenticated';
  END IF;

  INSERT INTO user_progress (user_id, read_topics, bookmarks, updated_at)
  VALUES (auth.uid(), '{}', '{}', NOW())
  ON CONFLICT (user_id) DO NOTHING;

  SELECT topic_slug = ANY(bookmarks), cardinality(bookmarks)
    INTO is_bookmarked, bookmark_count
  FROM user_progress
  WHERE user_id = auth.uid();

  IF is_bookmarked THEN
    UPDATE user_progress
    SET bookmarks = array_remove(bookmarks, topic_slug), updated_at = NOW()
    WHERE user_id = auth.uid();
    RETURN FALSE;
  ELSE
    IF bookmark_count >= 500 THEN
      RAISE EXCEPTION 'bookmark limit reached';
    END IF;
    UPDATE user_progress
    SET bookmarks = array_append(bookmarks, topic_slug), updated_at = NOW()
    WHERE user_id = auth.uid();
    RETURN TRUE;
  END IF;
END;
$$;

-- ---------- 2. Table-level CHECK constraints (defense in depth) ----------

ALTER TABLE user_progress
  DROP CONSTRAINT IF EXISTS user_progress_read_topics_len_chk,
  DROP CONSTRAINT IF EXISTS user_progress_bookmarks_len_chk,
  DROP CONSTRAINT IF EXISTS user_progress_last_visited_len_chk;

ALTER TABLE user_progress
  ADD CONSTRAINT user_progress_read_topics_len_chk
    CHECK (cardinality(read_topics) <= 1000),
  ADD CONSTRAINT user_progress_bookmarks_len_chk
    CHECK (cardinality(bookmarks) <= 500),
  ADD CONSTRAINT user_progress_last_visited_len_chk
    CHECK (last_visited IS NULL OR char_length(last_visited) <= 80);

-- ---------- 3. Lock the table to RPC-only writes ----------

REVOKE INSERT, UPDATE, DELETE ON TABLE user_progress FROM anon, authenticated;
-- SELECT stays granted so RLS-filtered reads (getUserProgress) keep working.

GRANT EXECUTE ON FUNCTION add_read_topic(TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION toggle_bookmark(TEXT) TO authenticated;
REVOKE EXECUTE ON FUNCTION add_read_topic(TEXT) FROM anon, PUBLIC;
REVOKE EXECUTE ON FUNCTION toggle_bookmark(TEXT) FROM anon, PUBLIC;
-- Note: Supabase anonymous users sign in via signInAnonymously() and are
-- issued the `authenticated` role (aud=authenticated), so the GRANT above
-- covers them. The `anon` role is for the pre-auth PostgREST key.
