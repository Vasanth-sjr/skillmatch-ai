-- SkillMatch AI — Add experience_level and work_mode to job_postings
-- Run this in the Supabase SQL Editor

ALTER TABLE public.job_postings
  ADD COLUMN IF NOT EXISTS experience_level TEXT,
  ADD COLUMN IF NOT EXISTS work_mode        TEXT DEFAULT 'On-site';
