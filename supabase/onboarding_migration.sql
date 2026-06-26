-- SkillMatch AI — Onboarding columns
-- Run this in the Supabase SQL Editor after the initial migration.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS headline          TEXT,
  ADD COLUMN IF NOT EXISTS linkedin_url      TEXT,
  ADD COLUMN IF NOT EXISTS github_url        TEXT,
  ADD COLUMN IF NOT EXISTS portfolio_url     TEXT,
  ADD COLUMN IF NOT EXISTS education         JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS experience        JSONB DEFAULT '[]',
  ADD COLUMN IF NOT EXISTS company_name      TEXT,
  ADD COLUMN IF NOT EXISTS company_industry  TEXT,
  ADD COLUMN IF NOT EXISTS company_size      TEXT,
  ADD COLUMN IF NOT EXISTS company_website   TEXT,
  ADD COLUMN IF NOT EXISTS company_description TEXT;
