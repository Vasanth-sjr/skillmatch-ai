-- SkillMatch AI — Job postings + Applications tables
-- Run this in the Supabase SQL Editor

-- 1. Job postings (created by employers)
CREATE TABLE IF NOT EXISTS public.job_postings (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  employer_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  title           TEXT NOT NULL,
  description     TEXT,
  required_skills TEXT[] DEFAULT '{}',
  location        TEXT,
  salary_range    TEXT,
  job_type        TEXT DEFAULT 'Full-time',
  career_domain   TEXT,
  is_active       BOOLEAN DEFAULT true,
  created_at      TIMESTAMPTZ DEFAULT now(),
  updated_at      TIMESTAMPTZ DEFAULT now()
);

-- 2. Applications (created by job seekers)
CREATE TABLE IF NOT EXISTS public.applications (
  id           UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  job_id       UUID REFERENCES public.job_postings(id) ON DELETE CASCADE NOT NULL,
  applicant_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  status       TEXT DEFAULT 'applied',  -- applied | reviewing | shortlisted | rejected | hired
  cover_note   TEXT,
  applied_at   TIMESTAMPTZ DEFAULT now(),
  UNIQUE(job_id, applicant_id)
);

-- 3. Enable RLS
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.applications ENABLE ROW LEVEL SECURITY;

-- 4. job_postings policies
CREATE POLICY "read_active_or_own_jobs" ON public.job_postings
  FOR SELECT USING (is_active = true OR employer_id = auth.uid());

CREATE POLICY "employers_insert_jobs" ON public.job_postings
  FOR INSERT WITH CHECK (employer_id = auth.uid());

CREATE POLICY "employers_update_own_jobs" ON public.job_postings
  FOR UPDATE USING (employer_id = auth.uid());

CREATE POLICY "employers_delete_own_jobs" ON public.job_postings
  FOR DELETE USING (employer_id = auth.uid());

-- 5. applications policies
CREATE POLICY "applicants_insert_own" ON public.applications
  FOR INSERT WITH CHECK (applicant_id = auth.uid());

CREATE POLICY "read_own_or_employer_applications" ON public.applications
  FOR SELECT USING (
    applicant_id = auth.uid()
    OR
    job_id IN (SELECT id FROM public.job_postings WHERE employer_id = auth.uid())
  );

CREATE POLICY "employers_update_application_status" ON public.applications
  FOR UPDATE USING (
    job_id IN (SELECT id FROM public.job_postings WHERE employer_id = auth.uid())
  );

-- 6. Allow authenticated users to read other profiles (needed for joins)
DO $$ BEGIN
  CREATE POLICY "authenticated_read_profiles" ON public.profiles
    FOR SELECT USING (auth.role() = 'authenticated');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
