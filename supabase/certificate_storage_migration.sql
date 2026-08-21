-- SkillMatch AI — Certificate document storage + document-check results
-- Run this in the Supabase SQL Editor after certificate_verification_migration.sql.
--
-- PRIVACY: certificate PDFs carry the holder's full legal name and often
-- their email. The bucket is therefore PRIVATE — files are reached only
-- through short-lived signed URLs, never a public link. Anyone who
-- guesses a path still gets nothing without a signature.

-- ── Storage bucket ────────────────────────────────────────────────────
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'certificates',
  'certificates',
  false,                                        -- private
  8388608,                                      -- 8 MB, matches MAX_CERT_FILE_BYTES
  ARRAY['application/pdf', 'image/png', 'image/jpeg']
)
ON CONFLICT (id) DO UPDATE
  SET public = false,
      file_size_limit = 8388608,
      allowed_mime_types = ARRAY['application/pdf', 'image/png', 'image/jpeg'];

-- Files are stored at  {user_id}/{certificate_id}.{ext}  so ownership is
-- provable from the path itself.
CREATE POLICY "users_upload_own_certificates" ON storage.objects
  FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_read_own_certificates" ON storage.objects
  FOR SELECT TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_update_own_certificates" ON storage.objects
  FOR UPDATE TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

CREATE POLICY "users_delete_own_certificates" ON storage.objects
  FOR DELETE TO authenticated
  USING (
    bucket_id = 'certificates'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

-- NOTE: employers are deliberately NOT granted read access to the raw
-- files here. They see the derived trust level, which carries the useful
-- signal without handing a candidate's identity documents to every
-- recruiter on the platform. Add a scoped, consent-based policy later if
-- employer file access is genuinely needed.

-- ── Document analysis results ─────────────────────────────────────────
CREATE TABLE IF NOT EXISTS public.certificate_documents (
  id              UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id         UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  certificate_id  TEXT NOT NULL,           -- CertEntry.id within profiles.certifications
  issuer          TEXT NOT NULL,
  storage_path    TEXT NOT NULL,
  file_name       TEXT,
  consistency     TEXT NOT NULL CHECK (consistency IN ('strong', 'partial', 'weak', 'unreadable')),
  extracted_id    TEXT,
  name_matched    BOOLEAN,
  notes           JSONB DEFAULT '[]',
  analyzed_at     TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, certificate_id)
);

ALTER TABLE public.certificate_documents ENABLE ROW LEVEL SECURITY;

CREATE POLICY "users_write_own_cert_documents" ON public.certificate_documents
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- Employers may read the DERIVED result (not the file) to show a badge.
CREATE POLICY "authenticated_read_cert_documents" ON public.certificate_documents
  FOR SELECT USING (auth.role() = 'authenticated');

CREATE INDEX IF NOT EXISTS idx_cert_documents_user
  ON public.certificate_documents (user_id);
