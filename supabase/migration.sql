-- SkillMatch AI — Supabase Migration
-- Run this in the Supabase SQL Editor to create all necessary tables.

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Profiles table (extends auth.users)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  full_name TEXT,
  email TEXT,
  role TEXT DEFAULT 'student' CHECK (role IN ('student', 'employer', 'admin')),
  avatar_url TEXT,
  bio TEXT,
  location TEXT,
  skills TEXT[] DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS on profiles
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

CREATE POLICY "Users can insert own profile" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

-- Auto-create profile on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, full_name, email, role)
  VALUES (
    NEW.id,
    NEW.raw_user_meta_data->>'full_name',
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'role', 'student')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE OR REPLACE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Courses table
CREATE TABLE IF NOT EXISTS public.courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  category TEXT,
  duration TEXT,
  level TEXT DEFAULT 'Beginner' CHECK (level IN ('Beginner', 'Intermediate', 'Advanced')),
  enrolled INTEGER DEFAULT 0,
  rating NUMERIC(2,1) DEFAULT 0.0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view courses" ON public.courses
  FOR SELECT USING (true);

-- Skill Tracks table
CREATE TABLE IF NOT EXISTS public.skill_tracks (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT,
  course_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.skill_tracks ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view skill tracks" ON public.skill_tracks
  FOR SELECT USING (true);

-- User Courses (enrollment junction table)
CREATE TABLE IF NOT EXISTS public.user_courses (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  course_id UUID REFERENCES public.courses(id) ON DELETE CASCADE,
  progress INTEGER DEFAULT 0 CHECK (progress >= 0 AND progress <= 100),
  enrolled_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ,
  UNIQUE(user_id, course_id)
);

ALTER TABLE public.user_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own enrollments" ON public.user_courses
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can enroll themselves" ON public.user_courses
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON public.user_courses
  FOR UPDATE USING (auth.uid() = user_id);

-- Assessments table
CREATE TABLE IF NOT EXISTS public.assessments (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  type TEXT DEFAULT 'Technical' CHECK (type IN ('Technical', 'Aptitude', 'Soft Skills')),
  scheduled_date DATE,
  duration TEXT,
  status TEXT DEFAULT 'upcoming' CHECK (status IN ('upcoming', 'in_progress', 'completed')),
  score INTEGER CHECK (score >= 0 AND score <= 100),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.assessments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own assessments" ON public.assessments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own assessments" ON public.assessments
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Uploads table
CREATE TABLE IF NOT EXISTS public.uploads (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_type TEXT,
  file_size BIGINT,
  file_url TEXT,
  upload_type TEXT DEFAULT 'resume' CHECK (upload_type IN ('resume', 'certificate', 'assignment', 'project')),
  status TEXT DEFAULT 'completed' CHECK (status IN ('uploading', 'completed', 'error', 'analyzed')),
  analysis_result JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE public.uploads ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own uploads" ON public.uploads
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can create own uploads" ON public.uploads
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Alerts table
CREATE TABLE IF NOT EXISTS public.alerts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  type TEXT DEFAULT 'warning' CHECK (type IN ('warning', 'error', 'info')),
  message TEXT NOT NULL,
  severity TEXT DEFAULT 'medium' CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  resolved BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ
);

ALTER TABLE public.alerts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own alerts" ON public.alerts
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own alerts" ON public.alerts
  FOR UPDATE USING (auth.uid() = user_id);

-- Seed some sample courses
INSERT INTO public.courses (title, description, category, duration, level, enrolled, rating) VALUES
  ('Advanced React Patterns', 'Master advanced React patterns including render props, compound components, and custom hooks.', 'Frontend', '6 weeks', 'Advanced', 245, 4.8),
  ('Machine Learning Fundamentals', 'Introduction to ML concepts, algorithms, and practical applications with Python.', 'Data Science', '8 weeks', 'Beginner', 380, 4.6),
  ('Cloud Architecture with AWS', 'Design and deploy scalable cloud solutions using Amazon Web Services.', 'DevOps', '10 weeks', 'Intermediate', 160, 4.7),
  ('Full-Stack Development Bootcamp', 'Build complete web applications from frontend to backend with modern technologies.', 'Full-Stack', '12 weeks', 'Intermediate', 520, 4.9),
  ('Data Structures & Algorithms', 'Essential DSA concepts for technical interviews and competitive programming.', 'Computer Science', '4 weeks', 'Intermediate', 890, 4.5);

-- Seed skill tracks
INSERT INTO public.skill_tracks (name, description, course_count) VALUES
  ('Frontend Development', 'Master modern frontend technologies', 5),
  ('Backend Development', 'Build robust server-side applications', 4),
  ('Data Science', 'Analyze data and build ML models', 6),
  ('DevOps & Cloud', 'Deploy and manage cloud infrastructure', 3),
  ('Mobile Development', 'Build native and cross-platform mobile apps', 4);
