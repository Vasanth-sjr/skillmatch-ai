-- SkillMatch AI — AMSCE Phase 7: Verification Trigger log
-- Run this in the Supabase SQL Editor after amsce_phase3_migration.sql.
--
-- Records when the engine asked a user to substantiate a skill, and what
-- happened next. This is what makes the loop closeable: without it we
-- can prompt but never learn whether prompting works, which action types
-- actually get acted on, or whether acting on them improved the score.

CREATE TABLE IF NOT EXISTS public.verification_trigger_log (
  id                 UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id            UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  career_path        TEXT NOT NULL,
  skill              TEXT NOT NULL,
  reason             TEXT NOT NULL CHECK (reason IN ('thin_evidence', 'conflicting_evidence')),
  self_rating        SMALLINT NOT NULL CHECK (self_rating BETWEEN 1 AND 5),
  confidence_at_fire NUMERIC(3,2) NOT NULL,
  -- The module the user was steered towards, and what we projected it
  -- would gain them. Storing the projection lets us later compare it
  -- against the confidence actually observed after they acted.
  suggested_module   TEXT,
  projected_gain     NUMERIC(3,2),
  -- Set when the user follows the suggestion; NULL while outstanding.
  acted_at           TIMESTAMPTZ,
  acted_module       TEXT,
  fired_at           TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, career_path, skill)
);

ALTER TABLE public.verification_trigger_log ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_write_own_trigger_log" ON public.verification_trigger_log
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Deliberately NOT readable by other authenticated users, unlike
-- skill_confidence_scores. That table holds a derived result a candidate
-- is choosing to present; this one holds a record of being told their
-- claims were thin. Exposing it to employers would turn a coaching
-- mechanism into a liability for the person it is meant to help.

CREATE INDEX IF NOT EXISTS idx_trigger_log_user_path
  ON public.verification_trigger_log (user_id, career_path);

CREATE INDEX IF NOT EXISTS idx_trigger_log_outstanding
  ON public.verification_trigger_log (user_id) WHERE acted_at IS NULL;
