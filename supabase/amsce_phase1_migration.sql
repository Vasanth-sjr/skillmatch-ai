-- SkillMatch AI — AMSCE Phase 1: Data Foundation
-- Run this in the Supabase SQL Editor after all prior migrations.
--
-- Adds the two tables needed before any AMSCE evidence-collection logic
-- can be built: a persisted, append-only skill self-rating history
-- (replacing localStorage in Skill Reviews) and learning-resource
-- engagement tracking (previously untracked entirely).

-- 1. Skill rating history — append-only, one row per rating event
CREATE TABLE IF NOT EXISTS public.skill_rating_history (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  career_path TEXT NOT NULL,
  skill       TEXT NOT NULL,
  rating      INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  rated_at    TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.skill_rating_history ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_rating_history" ON public.skill_rating_history
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_rating_history" ON public.skill_rating_history
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "users_delete_own_rating_history" ON public.skill_rating_history
  FOR DELETE USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_skill_rating_history_user_path
  ON public.skill_rating_history (user_id, career_path);

-- 2. Learning resource engagement — tracks which resources a user opens
CREATE TABLE IF NOT EXISTS public.learning_resource_engagement (
  id          UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id     UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  resource_id TEXT NOT NULL,
  career_path TEXT,
  skill_tags  TEXT[] DEFAULT '{}',
  engaged_at  TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE public.learning_resource_engagement ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_read_own_engagement" ON public.learning_resource_engagement
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "users_insert_own_engagement" ON public.learning_resource_engagement
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_learning_engagement_user
  ON public.learning_resource_engagement (user_id);
