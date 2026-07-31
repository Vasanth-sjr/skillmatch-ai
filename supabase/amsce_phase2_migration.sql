-- SkillMatch AI — AMSCE Phase 2: Interview Evidence
-- Run this in the Supabase SQL Editor after amsce_phase1_migration.sql.

CREATE TABLE IF NOT EXISTS public.interview_answer_analysis (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id    TEXT NOT NULL,
  career_path    TEXT NOT NULL,
  skill          TEXT NOT NULL,
  density        NUMERIC(3,2) NOT NULL CHECK (density >= 0 AND density <= 1),
  matched_terms  TEXT[] DEFAULT '{}',
  answered_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.interview_answer_analysis ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_interview_analysis" ON public.interview_answer_analysis
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_interview_analysis" ON public.interview_answer_analysis
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_interview_analysis_user_skill
  ON public.interview_answer_analysis (user_id, skill);
