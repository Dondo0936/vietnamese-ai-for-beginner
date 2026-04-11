-- ============================================================
-- Row Level Security (RLS) policies for user_progress table
-- Apply these in the Supabase dashboard SQL editor or via migration.
-- ============================================================

-- 1. Enable RLS on the table
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;

-- 2. Users can only read their own progress
CREATE POLICY "Users can read own progress"
  ON user_progress
  FOR SELECT
  USING (auth.uid() = user_id);

-- 3. Users can only insert their own progress
CREATE POLICY "Users can insert own progress"
  ON user_progress
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- 4. Users can only update their own progress
CREATE POLICY "Users can update own progress"
  ON user_progress
  FOR UPDATE
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 5. No DELETE policy — users cannot delete progress rows
--    (denied by default when RLS is enabled)

-- ============================================================
-- Optional: Atomic array operations (avoids read-modify-write races)
-- ============================================================

-- Atomically add a topic slug to the read_topics array
CREATE OR REPLACE FUNCTION add_read_topic(topic_slug TEXT)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  INSERT INTO user_progress (user_id, read_topics, last_visited, updated_at)
  VALUES (auth.uid(), ARRAY[topic_slug], topic_slug, NOW())
  ON CONFLICT (user_id)
  DO UPDATE SET
    read_topics = CASE
      WHEN topic_slug = ANY(user_progress.read_topics) THEN user_progress.read_topics
      ELSE array_append(user_progress.read_topics, topic_slug)
    END,
    last_visited = topic_slug,
    updated_at = NOW();
END;
$$;

-- Atomically toggle a bookmark slug in the bookmarks array
CREATE OR REPLACE FUNCTION toggle_bookmark(topic_slug TEXT)
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  is_bookmarked BOOLEAN;
BEGIN
  -- Ensure a row exists
  INSERT INTO user_progress (user_id, read_topics, bookmarks, updated_at)
  VALUES (auth.uid(), '{}', '{}', NOW())
  ON CONFLICT (user_id) DO NOTHING;

  -- Check if already bookmarked
  SELECT topic_slug = ANY(bookmarks) INTO is_bookmarked
  FROM user_progress
  WHERE user_id = auth.uid();

  IF is_bookmarked THEN
    UPDATE user_progress
    SET bookmarks = array_remove(bookmarks, topic_slug), updated_at = NOW()
    WHERE user_id = auth.uid();
    RETURN FALSE;
  ELSE
    UPDATE user_progress
    SET bookmarks = array_append(bookmarks, topic_slug), updated_at = NOW()
    WHERE user_id = auth.uid();
    RETURN TRUE;
  END IF;
END;
$$;
