-- SkillMatch AI — interview answer storage + employer sharing consent
-- Run this in the Supabase SQL Editor after amsce_phase2_migration.sql.
--
-- Until now only the DERIVED density score was stored, never the words a
-- candidate actually wrote. Recruiters find the raw answer far more
-- convincing than any score — it's evidence a human can judge directly,
-- with no algorithm to trust — so it's worth storing. But storing
-- someone's written work and showing it to employers is a materially
-- bigger privacy step than storing a number, and it gets an explicit
-- consent model rather than being switched on by default.

CREATE TABLE IF NOT EXISTS public.interview_answers (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id      UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  question_id  TEXT NOT NULL,
  career_path  TEXT NOT NULL,
  answer_text  TEXT NOT NULL,
  answered_at  TIMESTAMPTZ DEFAULT now(),
  -- One row per question: a re-answer replaces the old text rather than
  -- accumulating drafts, since only the latest attempt is the claim.
  UNIQUE(user_id, question_id)
);

ALTER TABLE public.interview_answers ENABLE ROW LEVEL SECURITY;

-- Candidates always control their own answers.
CREATE POLICY "users_write_own_answers" ON public.interview_answers
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Consent flag. Default FALSE deliberately: opt-in, not opt-out. A
-- candidate should never discover after the fact that what they wrote as
-- practice was shown to a recruiter.
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS share_interview_answers BOOLEAN DEFAULT false;

-- Employers may read an answer only when BOTH hold:
--   1. the candidate has consented to sharing, and
--   2. the candidate actually applied to one of that employer's jobs.
--
-- The second condition matters. Consent here means "employers I applied
-- to may see my reasoning", not "anyone with a recruiter login may browse
-- my writing". Without it, one checkbox would expose a candidate's work
-- to every employer on the platform, which is not what they agreed to.
CREATE POLICY "employers_read_consented_answers" ON public.interview_answers
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles p
      WHERE p.id = interview_answers.user_id
        AND p.share_interview_answers = true
    )
    AND EXISTS (
      SELECT 1
      FROM public.applications a
      JOIN public.job_postings j ON j.id = a.job_id
      WHERE a.applicant_id = interview_answers.user_id
        AND j.employer_id = auth.uid()
    )
  );

CREATE INDEX IF NOT EXISTS idx_interview_answers_user
  ON public.interview_answers (user_id);
