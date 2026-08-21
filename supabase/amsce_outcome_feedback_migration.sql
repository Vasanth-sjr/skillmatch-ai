-- SkillMatch AI — AMSCE Phase 8: hiring outcome feedback
-- Run this in the Supabase SQL Editor after amsce_phase3_migration.sql.
--
-- Captures what actually happened to a candidate, paired with a SNAPSHOT
-- of what AMSCE said about them at the moment of the decision.
--
-- The snapshot is the whole point. skill_confidence_scores is
-- recomputed continuously as evidence accumulates, so reading it after
-- the fact would tell you what the engine thinks NOW, not what the
-- employer was shown when they decided. Analysing calibration against
-- live scores would silently compare the wrong things.

CREATE TABLE IF NOT EXISTS public.hiring_outcome_feedback (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  application_id  UUID REFERENCES public.applications(id) ON DELETE CASCADE NOT NULL,
  candidate_id    UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  employer_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  outcome         TEXT NOT NULL CHECK (outcome IN ('shortlisted', 'rejected', 'hired')),
  -- What the engine said at decision time: per-skill scores, confidence,
  -- and how many evidence sources contributed. Frozen deliberately.
  confidence_snapshot JSONB DEFAULT '[]',
  -- Aggregates lifted out of the snapshot so calibration queries don't
  -- have to unpack JSON on every row.
  mean_confidence NUMERIC(3,2),
  corroborated_skills SMALLINT,
  decided_at      TIMESTAMPTZ DEFAULT now(),
  UNIQUE(application_id, outcome)
);

ALTER TABLE public.hiring_outcome_feedback ENABLE ROW LEVEL SECURITY;

-- Employers write and read outcomes for their own hiring decisions.
CREATE POLICY "employers_write_own_outcomes" ON public.hiring_outcome_feedback
  FOR ALL USING (auth.uid() = employer_id) WITH CHECK (auth.uid() = employer_id);

-- Candidates may read outcomes recorded about them. This is deliberate:
-- a system that scores people and feeds those scores into hiring
-- decisions should not also make the record of those decisions invisible
-- to the person scored.
CREATE POLICY "candidates_read_own_outcomes" ON public.hiring_outcome_feedback
  FOR SELECT USING (auth.uid() = candidate_id);

CREATE INDEX IF NOT EXISTS idx_outcome_employer ON public.hiring_outcome_feedback (employer_id);
CREATE INDEX IF NOT EXISTS idx_outcome_candidate ON public.hiring_outcome_feedback (candidate_id);
