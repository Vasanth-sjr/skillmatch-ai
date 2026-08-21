// AMSCE — Hiring Outcome Feedback (Phase 8)
//
// ── WHY THIS DOES NOT AUTO-TUNE WEIGHTS ───────────────────────────────
//
// The obvious version of a "learning feedback loop" adjusts module
// weights automatically from hiring outcomes: if candidates with strong
// certificate evidence get hired more often, weight certificates higher.
// This module deliberately does NOT do that, for three reasons.
//
// 1. Statistics. Weight tuning on a few dozen outcomes fits noise. A
//    small employer's hiring history cannot support the inference, and
//    the resulting weights would look authoritative while being
//    arbitrary.
//
// 2. Bias. Hiring outcomes encode whatever preferences the hiring
//    process already had, including unlawful ones. A loop that optimises
//    module weights to predict past hiring decisions will faithfully
//    reproduce those preferences and launder them through a scoring
//    mechanism that appears objective. This is the single most dangerous
//    thing this system could be built to do.
//
// 3. Explainability. AMSCE is deterministic and rule-based by design —
//    that's what makes each score traceable and what keeps the mechanism
//    describable rather than opaque. Weights silently drifting from
//    outcome data would forfeit exactly that property.
//
// So what this module does instead is MEASURE and REPORT: does higher
// confidence actually correspond to better outcomes? That question is
// answerable, useful, and safe. Acting on the answer stays a human
// decision, made deliberately, with the sample size visible.

import { supabase } from "@/integrations/supabase/client";
import { CandidateSkillEvidence } from "./candidateEvidence";

export type HiringOutcome = "shortlisted" | "rejected" | "hired";

export interface CalibrationReport {
  /** Outcomes recorded, total. */
  sampleSize: number;
  meanConfidenceHired: number | null;
  meanConfidenceRejected: number | null;
  /** Positive means higher confidence went with better outcomes. */
  separation: number | null;
  /** Whether the sample is large enough to mean anything. */
  interpretable: boolean;
  note: string;
}

// Below this, differences between groups are noise. Chosen to be
// deliberately conservative: reporting "candidates with high confidence
// are hired more" off six data points would be worse than saying nothing.
const MIN_INTERPRETABLE_SAMPLE = 30;

/**
 * Records an outcome together with a frozen snapshot of what the engine
 * said at the time.
 *
 * Fire-and-forget by design — a failure here must never block an
 * employer from moving an application forward. The feedback data is
 * valuable, but it is not worth breaking the hiring workflow over.
 */
export async function recordHiringOutcome(
  applicationId: string,
  candidateId: string,
  employerId: string,
  outcome: HiringOutcome,
  evidence: CandidateSkillEvidence[],
): Promise<void> {
  const corroborated = evidence.filter(e => e.sourcesWithEvidence > 0);
  const meanConfidence = corroborated.length
    ? corroborated.reduce((sum, e) => sum + e.confidenceScore, 0) / corroborated.length
    : null;

  const snapshot = evidence.map(e => ({
    skill: e.skill,
    skillScore: e.skillScore,
    confidenceScore: e.confidenceScore,
    sourcesWithEvidence: e.sourcesWithEvidence,
  }));

  const { error } = await (supabase as any)
    .from("hiring_outcome_feedback")
    .upsert({
      application_id: applicationId,
      candidate_id: candidateId,
      employer_id: employerId,
      outcome,
      confidence_snapshot: snapshot,
      mean_confidence: meanConfidence === null ? null : Math.round(meanConfidence * 100) / 100,
      corroborated_skills: corroborated.length,
      decided_at: new Date().toISOString(),
    }, { onConflict: "application_id,outcome" });

  if (error) console.error("Couldn't record hiring outcome:", error);
}

/**
 * Does higher AMSCE confidence correspond to better hiring outcomes?
 *
 * Reports the comparison and, crucially, whether the sample supports
 * reading anything into it. `interpretable: false` is a real answer, not
 * a placeholder — most deployments will sit there for a long time, and
 * saying so is more useful than a number that invites over-reading.
 */
export async function buildCalibrationReport(employerId: string): Promise<CalibrationReport> {
  const { data, error } = await (supabase as any)
    .from("hiring_outcome_feedback")
    .select("outcome, mean_confidence")
    .eq("employer_id", employerId)
    .not("mean_confidence", "is", null);

  if (error) {
    console.error("Couldn't build calibration report:", error);
    return emptyReport("Couldn't load outcome data.");
  }

  const rows = data ?? [];
  const mean = (outcome: HiringOutcome) => {
    const vals = rows
      .filter((r: any) => r.outcome === outcome)
      .map((r: any) => Number(r.mean_confidence));
    return vals.length ? vals.reduce((a: number, b: number) => a + b, 0) / vals.length : null;
  };

  const hired = mean("hired");
  const rejected = mean("rejected");
  const interpretable = rows.length >= MIN_INTERPRETABLE_SAMPLE;

  return {
    sampleSize: rows.length,
    meanConfidenceHired: hired,
    meanConfidenceRejected: rejected,
    separation: hired !== null && rejected !== null ? hired - rejected : null,
    interpretable,
    note: interpretable
      ? "Compares AMSCE confidence against your recorded outcomes. Weights are not adjusted automatically — see the note on why."
      : `Not enough decisions yet to read anything into this (${rows.length} of ${MIN_INTERPRETABLE_SAMPLE}). Shown for transparency, not for acting on.`,
  };
}

function emptyReport(note: string): CalibrationReport {
  return {
    sampleSize: 0,
    meanConfidenceHired: null,
    meanConfidenceRejected: null,
    separation: null,
    interpretable: false,
    note,
  };
}
