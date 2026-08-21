// Upload, retrieval and deletion of certificate documents, plus the
// persisted result of analysing them.
//
// The bucket is private. Files are only ever reached through short-lived
// signed URLs — a certificate PDF carries the holder's legal name and
// often their email, so it must not sit behind a guessable public link.

import { supabase } from "@/integrations/supabase/client";
import { DocumentAnalysis, DocumentConsistency } from "./certificateDocument";

const BUCKET = "certificates";
const SIGNED_URL_TTL_SECONDS = 300; // 5 minutes

export interface StoredCertificateDocument {
  certificateId: string;
  issuer: string;
  storagePath: string;
  fileName: string | null;
  consistency: DocumentConsistency;
  extractedId: string | null;
  nameMatched: boolean | null;
  notes: string[];
  analyzedAt: string;
}

function extensionFor(file: File): string {
  if (file.type === "application/pdf") return "pdf";
  if (file.type === "image/png") return "png";
  return "jpg";
}

/** Path encodes ownership: {user_id}/{certificate_id}.{ext} */
export function storagePathFor(userId: string, certificateId: string, file: File): string {
  return `${userId}/${certificateId}.${extensionFor(file)}`;
}

export async function uploadCertificateFile(
  userId: string, certificateId: string, file: File,
): Promise<{ path: string | null; error: string | null }> {
  const path = storagePathFor(userId, certificateId, file);

  const { error } = await supabase.storage
    .from(BUCKET)
    .upload(path, file, { upsert: true, contentType: file.type });

  if (error) {
    console.error("Certificate upload failed:", error);
    return { path: null, error: error.message };
  }
  return { path, error: null };
}

export async function getCertificateSignedUrl(storagePath: string): Promise<string | null> {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .createSignedUrl(storagePath, SIGNED_URL_TTL_SECONDS);

  if (error) {
    console.error("Couldn't create signed URL for certificate:", error);
    return null;
  }
  return data?.signedUrl ?? null;
}

export async function deleteCertificateFile(storagePath: string): Promise<void> {
  const { error } = await supabase.storage.from(BUCKET).remove([storagePath]);
  if (error) console.error("Couldn't delete certificate file:", error);
}

export async function saveDocumentAnalysis(
  userId: string,
  certificateId: string,
  issuer: string,
  storagePath: string,
  fileName: string,
  analysis: DocumentAnalysis,
): Promise<string | null> {
  const { error } = await (supabase as any)
    .from("certificate_documents")
    .upsert({
      user_id: userId,
      certificate_id: certificateId,
      issuer,
      storage_path: storagePath,
      file_name: fileName,
      consistency: analysis.consistency,
      extracted_id: analysis.extractedCredentialId,
      name_matched: analysis.holderNameMatches,
      notes: analysis.notes,
      analyzed_at: new Date().toISOString(),
    }, { onConflict: "user_id,certificate_id" });

  if (error) {
    console.error("Couldn't save certificate document analysis:", error);
    return error.message;
  }
  return null;
}

export async function loadDocumentAnalyses(
  userId: string,
): Promise<Record<string, StoredCertificateDocument>> {
  const { data, error } = await (supabase as any)
    .from("certificate_documents")
    .select("certificate_id, issuer, storage_path, file_name, consistency, extracted_id, name_matched, notes, analyzed_at")
    .eq("user_id", userId);

  if (error) {
    console.error("Couldn't load certificate documents:", error);
    return {};
  }

  const byCert: Record<string, StoredCertificateDocument> = {};
  for (const row of data ?? []) {
    byCert[row.certificate_id] = {
      certificateId: row.certificate_id,
      issuer: row.issuer,
      storagePath: row.storage_path,
      fileName: row.file_name,
      consistency: row.consistency,
      extractedId: row.extracted_id,
      nameMatched: row.name_matched,
      notes: Array.isArray(row.notes) ? row.notes : [],
      analyzedAt: row.analyzed_at,
    };
  }
  return byCert;
}

export async function removeDocumentAnalysis(userId: string, certificateId: string) {
  const { error } = await (supabase as any)
    .from("certificate_documents")
    .delete()
    .eq("user_id", userId)
    .eq("certificate_id", certificateId);
  if (error) console.error("Couldn't remove certificate document record:", error);
}
