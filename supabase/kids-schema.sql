-- ============================================================
-- Kids Learning Path — schema additions
-- Spec: docs/superpowers/specs/2026-04-12-kids-learning-path-design.md §8
-- Apply in the Supabase dashboard SQL editor (or via Management API).
-- ============================================================

-- 1. kid_profiles: parent-owned kid profile rows
CREATE TABLE IF NOT EXISTS public.kid_profiles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  parent_user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name text NOT NULL,
  birth_year int NOT NULL CHECK (birth_year BETWEEN 2010 AND 2020),
  tier text NOT NULL CHECK (tier IN ('nhi', 'teen')),
  pin_hash text,
  consent_given_at timestamptz,
  consent_version text,
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
);

-- 2. kid_artifacts: the parent-dashboard trust asset
CREATE TABLE IF NOT EXISTS public.kid_artifacts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  topic_slug text NOT NULL,
  kind text NOT NULL CHECK (kind IN ('classifier','story','sketch','quiz-completion','drawing','other')),
  payload jsonb,
  thumbnail_url text,
  created_at timestamptz DEFAULT now()
);

-- 3. retention_checks: the Strategy B 3-day spaced-retrieval mechanism
CREATE TABLE IF NOT EXISTS public.retention_checks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  kid_profile_id uuid NOT NULL REFERENCES public.kid_profiles(id) ON DELETE CASCADE,
  topic_slug text NOT NULL,
  concept_key text NOT NULL,
  scheduled_for timestamptz NOT NULL,
  asked_at timestamptz,
  remembered boolean,
  question_payload jsonb
);

-- ============================================================
-- Row Level Security
-- ============================================================

ALTER TABLE public.kid_profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.kid_artifacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.retention_checks ENABLE ROW LEVEL SECURITY;

-- Parents manage their own kid_profiles rows
DROP POLICY IF EXISTS "parent reads own kids" ON public.kid_profiles;
CREATE POLICY "parent reads own kids" ON public.kid_profiles
  FOR SELECT USING (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "parent inserts own kids" ON public.kid_profiles;
CREATE POLICY "parent inserts own kids" ON public.kid_profiles
  FOR INSERT WITH CHECK (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "parent updates own kids" ON public.kid_profiles;
CREATE POLICY "parent updates own kids" ON public.kid_profiles
  FOR UPDATE USING (auth.uid() = parent_user_id);

DROP POLICY IF EXISTS "parent deletes own kids" ON public.kid_profiles;
CREATE POLICY "parent deletes own kids" ON public.kid_profiles
  FOR DELETE USING (auth.uid() = parent_user_id);

-- Parents read artifacts/retention-checks for THEIR OWN kids only
DROP POLICY IF EXISTS "parent reads own kid artifacts" ON public.kid_artifacts;
CREATE POLICY "parent reads own kid artifacts" ON public.kid_artifacts
  FOR SELECT USING (
    kid_profile_id IN (
      SELECT id FROM public.kid_profiles WHERE parent_user_id = auth.uid()
    )
  );

DROP POLICY IF EXISTS "parent reads own kid retention" ON public.retention_checks;
CREATE POLICY "parent reads own kid retention" ON public.retention_checks
  FOR SELECT USING (
    kid_profile_id IN (
      SELECT id FROM public.kid_profiles WHERE parent_user_id = auth.uid()
    )
  );

-- Kid-device writes go through RPCs, not direct inserts. No INSERT/UPDATE policies for
-- kid_artifacts or retention_checks — RPCs run SECURITY DEFINER (see below) and bypass RLS.

-- ============================================================
-- RPC: record_artifact — kid devices (no auth.uid()) call this via a
-- signed handoff token; function runs SECURITY DEFINER so it can insert
-- bypassing RLS. Phase 2 mints the handoff token when the parent sets
-- the kid's PIN on the device.
-- ============================================================

CREATE OR REPLACE FUNCTION public.record_artifact(
  p_kid_profile_id uuid,
  p_handoff_token text,
  p_topic_slug text,
  p_kind text,
  p_payload jsonb,
  p_thumbnail_url text
) RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  new_id uuid;
BEGIN
  -- TODO (Phase 2): verify p_handoff_token against a short-lived
  -- server-minted JWT before allowing the insert. For now, Phase 1
  -- stubs the function so the schema is in place; the token check is
  -- added in Phase 2 when kid-device auth ships.
  INSERT INTO public.kid_artifacts (
    kid_profile_id, topic_slug, kind, payload, thumbnail_url
  ) VALUES (
    p_kid_profile_id, p_topic_slug, p_kind, p_payload, p_thumbnail_url
  )
  RETURNING id INTO new_id;

  RETURN new_id;
END;
$$;

-- Lock the function from anonymous callers until Phase 2 hardens the
-- token check. Only the service_role can call it in Phase 1.
REVOKE EXECUTE ON FUNCTION public.record_artifact FROM PUBLIC;
REVOKE EXECUTE ON FUNCTION public.record_artifact FROM anon;
REVOKE EXECUTE ON FUNCTION public.record_artifact FROM authenticated;
GRANT EXECUTE ON FUNCTION public.record_artifact TO service_role;
