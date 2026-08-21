-- SkillMatch AI — Certificate Verification cache
-- Run this in the Supabase SQL Editor.
--
-- Caches the result of a server-side verification so we re-check a given
-- credential at most once per TTL rather than on every page render. This
-- is both a performance measure and a courtesy to the issuers whose public
-- pages we're reading.

CREATE TABLE IF NOT EXISTS public.certificate_verifications (
  id             UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id        UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  issuer         TEXT NOT NULL,
  credential_id  TEXT NOT NULL,
  status         TEXT NOT NULL CHECK (status IN
                   ('verified', 'invalid', 'inconclusive', 'unreachable', 'unsupported')),
  -- Raw classifier reason (e.g. "valid_marker:course certificate",
  -- "no_marker:http_200:len_48210"). Kept so the issuer content markers
  -- can be tuned against what these pages actually return in production.
  signal         TEXT,
  message        TEXT,
  checked_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, issuer, credential_id)
);

ALTER TABLE public.certificate_verifications ENABLE ROW LEVEL SECURITY;

-- Owner can write their own verification results.
CREATE POLICY "users_write_own_cert_verifications" ON public.certificate_verifications
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Any authenticated user may read — an employer viewing a candidate needs
-- to see the verification badge without re-running the check themselves.
CREATE POLICY "authenticated_read_cert_verifications" ON public.certificate_verifications
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_cert_verifications_user
  ON public.certificate_verifications (user_id);
