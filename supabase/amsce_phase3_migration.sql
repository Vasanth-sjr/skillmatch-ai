-- SkillMatch AI — AMSCE Phase 3: Adaptive Confidence Engine output cache
-- Run this in the Supabase SQL Editor after amsce_phase1/2_migration.sql.

CREATE TABLE IF NOT EXISTS public.skill_confidence_scores (
  id                UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id           UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  career_path       TEXT NOT NULL,
  skill             TEXT NOT NULL,
  skill_score       NUMERIC(3,1) NOT NULL,
  confidence_score  NUMERIC(3,2) NOT NULL CHECK (confidence_score >= 0 AND confidence_score <= 1),
  confidence_state  TEXT NOT NULL CHECK (confidence_state IN ('Low', 'Medium', 'High')),
  explainability    JSONB DEFAULT '[]',
  evidence_breakdown JSONB DEFAULT '{}',
  last_computed_at  TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, career_path, skill)
);

ALTER TABLE public.skill_confidence_scores ENABLE ROW LEVEL SECURITY;

-- Owner can write their own computed scores.
CREATE POLICY "users_write_own_confidence_scores" ON public.skill_confidence_scores
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Any authenticated user may read — needed so an employer's HR portal
-- (Phase 4) can display a candidate's confidence badge without requiring
-- the candidate's own browser to be the one computing it for that view.
CREATE POLICY "authenticated_read_confidence_scores" ON public.skill_confidence_scores
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_skill_confidence_user_path
  ON public.skill_confidence_scores (user_id, career_path);
