-- SkillMatch AI — Career onboarding columns
-- Run this in the Supabase SQL Editor after onboarding_migration.sql

ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS career_goal    TEXT,
  ADD COLUMN IF NOT EXISTS career_status  TEXT;
