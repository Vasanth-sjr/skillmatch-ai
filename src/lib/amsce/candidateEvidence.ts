// Employer-facing view of a candidate's evidence.
//
// ── A FAIRNESS CONSTRAINT SHAPES THIS WHOLE MODULE ────────────────────
//
// AMSCE's confidence score measures how much corroborating evidence this
// PLATFORM has gathered — not how truthful the candidate is. Those are
// very different things, and a recruiter skimming a list will not make
// the distinction unless the interface makes it for them. "Low
// confidence" next to a skill reads as "probably exaggerating", when it
// usually means "hasn't taken a mock interview yet".
//
// So the employer view leads with WHAT EVIDENCE EXISTS rather than with
// a verdict: a verified certificate, a demonstrated interview answer, a
// mention in work history. Recruiters get something more useful than a
// score, and candidates aren't penalised for gaps in our data collection.
//
// The raw confidence number is still available, but it is presented as
// evidence coverage, never as a credibility judgement.

import { supabase } from "@/integrations/supabase/client";

export interface CandidateSkillEvidence {
  skill: string;
  careerPath: string;
  /** AMSCE's calibrated score, 1–5. */
  skillScore: number;
  /** The candidate's own rating, for comparison. */
  selfRating: number | null;
  confidenceScore: number;
  confidenceState: "Low" | "Medium" | "High";
  /** Human-readable findings, filtered to the corroborating ones. */
  supportingEvidence: string[];
  /** How many independent modules produced evidence. */
  sourcesWithEvidence: number;
  totalSources: number;
  lastComputedAt: string;
}

export interface CandidateCertificate {
  name: string;
  issuer: string;
  issueDate: string;
  trustLevel: "verified" | "corroborated" | "self_reported" | "disputed";
}

/** Only the lines that describe corroboration, not the absences. */
function supportingOnly(explainability: unknown): string[] {
  if (!Array.isArray(explainability)) return [];
  return explainability.filter(line => typeof line === "string" && line.startsWith("✓"));
}

function countSourcesWithEvidence(breakdown: any): { withEvidence: number; total: number } {
  const modules = breakdown?.modules;
  if (!Array.isArray(modules)) return { withEvidence: 0, total: 0 };
  const evidential = modules.filter((m: any) => m.evidential !== false);
  return {
    withEvidence: evidential.filter((m: any) => (m.discountedEvidence ?? 0) > 0).length,
    total: evidential.length,
  };
}

export async function loadCandidateSkillEvidence(
  candidateId: string,
): Promise<CandidateSkillEvidence[]> {
  const { data, error } = await (supabase as any)
    .from("skill_confidence_scores")
    .select("skill, career_path, skill_score, confidence_score, confidence_state, explainability, evidence_breakdown, last_computed_at")
    .eq("user_id", candidateId)
    .order("skill_score", { ascending: false });

  if (error) {
    console.error("Couldn't load candidate skill evidence:", error);
    return [];
  }

  return (data ?? []).map((row: any) => {
    const { withEvidence, total } = countSourcesWithEvidence(row.evidence_breakdown);
    return {
      skill: row.skill,
      careerPath: row.career_path,
      skillScore: Number(row.skill_score),
      selfRating: row.evidence_breakdown?.selfRating ?? null,
      confidenceScore: Number(row.confidence_score),
      confidenceState: row.confidence_state,
      supportingEvidence: supportingOnly(row.explainability),
      sourcesWithEvidence: withEvidence,
      totalSources: total,
      lastComputedAt: row.last_computed_at,
    };
  });
}

export interface CandidateEvidenceSummary {
  corroboratedSkills: number;
  verifiedCertificates: number;
}

/**
 * Compact counts for a list of candidates, fetched in two batched
 * queries rather than per row — a candidates list can hold dozens of
 * applicants and per-row requests would be an easy N+1.
 */
export async function loadCandidateEvidenceSummaries(
  candidateIds: string[],
): Promise<Record<string, CandidateEvidenceSummary>> {
  const ids = Array.from(new Set(candidateIds.filter(Boolean)));
  if (ids.length === 0) return {};

  const [scores, verifications] = await Promise.all([
    (supabase as any)
      .from("skill_confidence_scores")
      .select("user_id, evidence_breakdown")
      .in("user_id", ids),
    (supabase as any)
      .from("certificate_verifications")
      .select("user_id, status")
      .in("user_id", ids)
      .eq("status", "verified"),
  ]);

  if (scores.error) console.error("Couldn't load candidate evidence summaries:", scores.error);
  if (verifications.error) console.error("Couldn't load candidate verifications:", verifications.error);

  const summary: Record<string, CandidateEvidenceSummary> = {};
  const ensure = (id: string) =>
    (summary[id] ??= { corroboratedSkills: 0, verifiedCertificates: 0 });

  for (const row of scores.data ?? []) {
    const { withEvidence } = countSourcesWithEvidence(row.evidence_breakdown);
    if (withEvidence > 0) ensure(row.user_id).corroboratedSkills += 1;
  }
  for (const row of verifications.data ?? []) {
    ensure(row.user_id).verifiedCertificates += 1;
  }

  return summary;
}

/**
 * Certificates with their trust level.
 *
 * Employers deliberately receive the DERIVED trust level and never the
 * uploaded file — the storage bucket's RLS grants no employer access.
 * A certificate PDF carries the holder's legal name and often their
 * email, and handing identity documents to every recruiter on the
 * platform is not a reasonable price for showing a badge.
 */
export async function loadCandidateCertificates(
  candidateId: string,
  certifications: any[],
): Promise<CandidateCertificate[]> {
  if (!certifications || certifications.length === 0) return [];

  const [verifications, documents] = await Promise.all([
    (supabase as any)
      .from("certificate_verifications")
      .select("issuer, credential_id, status")
      .eq("user_id", candidateId),
    (supabase as any)
      .from("certificate_documents")
      .select("certificate_id, consistency")
      .eq("user_id", candidateId),
  ]);

  const byKey = new Map<string, string>();
  for (const row of verifications.data ?? []) {
    byKey.set(`${row.issuer}::${String(row.credential_id).trim()}`, row.status);
  }
  const byCertId = new Map<string, string>();
  for (const row of documents.data ?? []) {
    byCertId.set(row.certificate_id, row.consistency);
  }

  const { assessCredentialTrust } = await import("@/lib/certificates/credentialTrust");

  return certifications
    .filter((c: any) => (c.name ?? "").trim())
    .map((c: any) => ({
      name: c.name,
      issuer: c.issuer ?? "",
      issueDate: c.issueDate ?? "",
      trustLevel: assessCredentialTrust(
        (byKey.get(`${c.issuer ?? ""}::${(c.credentialId ?? "").trim()}`) as any) ?? null,
        (byCertId.get(c.id) as any) ?? null,
      ).level,
    }));
}
