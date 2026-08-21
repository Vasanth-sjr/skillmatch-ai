// Resolves a user's certificates into the form AMSCE consumes: each one
// paired with how much independent backing it actually has.
//
// This is the join between the verification work and the confidence
// engine. Everything upstream — format checks, live issuer probing,
// document cross-checking — exists so that this function can hand AMSCE
// a trust level rather than an unverified claim.

import { supabase } from "@/integrations/supabase/client";
import { assessCredentialTrust, TrustLevel } from "./credentialTrust";
import { VerificationStatus } from "./verifyCertificate";
import { DocumentConsistency } from "./certificateDocument";

export interface CertificateEvidence {
  name: string;
  issuer: string;
  issueDate: string;   // "YYYY-MM" from the profile form, possibly empty
  expiryDate: string;
  trustLevel: TrustLevel;
}

interface RawCertificate {
  id?: string;
  name?: string;
  issuer?: string;
  credentialId?: string;
  issueDate?: string;
  expiryDate?: string;
}

/**
 * Loads the verification and document-check results for a user and pairs
 * them with the certificates on their profile.
 *
 * Certificates with no supporting record at all still come back, as
 * `self_reported` — omitting them would silently treat an unbacked claim
 * as no claim, when what we want is for it to count for very little.
 */
export async function loadCertificateEvidence(
  userId: string,
  certifications: RawCertificate[],
): Promise<CertificateEvidence[]> {
  if (!certifications || certifications.length === 0) return [];

  const [verifications, documents] = await Promise.all([
    (supabase as any)
      .from("certificate_verifications")
      .select("issuer, credential_id, status")
      .eq("user_id", userId),
    (supabase as any)
      .from("certificate_documents")
      .select("certificate_id, consistency")
      .eq("user_id", userId),
  ]);

  if (verifications.error) console.error("Couldn't load certificate verifications:", verifications.error);
  if (documents.error) console.error("Couldn't load certificate documents:", documents.error);

  const verificationByKey = new Map<string, VerificationStatus>();
  for (const row of verifications.data ?? []) {
    verificationByKey.set(`${row.issuer}::${String(row.credential_id).trim()}`, row.status);
  }

  const consistencyByCertId = new Map<string, DocumentConsistency>();
  for (const row of documents.data ?? []) {
    consistencyByCertId.set(row.certificate_id, row.consistency);
  }

  return certifications
    .filter(c => (c.name ?? "").trim().length > 0)
    .map(c => {
      const key = `${c.issuer ?? ""}::${(c.credentialId ?? "").trim()}`;
      const trust = assessCredentialTrust(
        verificationByKey.get(key) ?? null,
        (c.id ? consistencyByCertId.get(c.id) : undefined) ?? null,
      );
      return {
        name: c.name ?? "",
        issuer: c.issuer ?? "",
        issueDate: c.issueDate ?? "",
        expiryDate: c.expiryDate ?? "",
        trustLevel: trust.level,
      };
    });
}
