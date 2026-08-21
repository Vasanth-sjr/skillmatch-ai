// AMSCE — Verification Trigger (Phase 7)
//
// Closes the loop. The confidence engine can already tell a user that a
// skill they rated highly isn't well corroborated; this decides what to
// actually DO about it, and ranks the options by how much each would
// help.
//
// ── WHY RANKING MATTERS ───────────────────────────────────────────────
//
// A trigger that says "add more evidence" is a nag. The useful version
// names the single highest-leverage action, and it can, because the
// confidence formula is fully deterministic: for each absent module we
// can recompute what confidence WOULD be if that module produced
// evidence, and rank by the actual difference. No heuristics, no
// guessing at what users find motivating — just the arithmetic of the
// engine run backwards.
//
// ── TWO DISTINCT CONDITIONS ───────────────────────────────────────────
//
// "Thin" and "contradicted" are different problems and get different
// treatment. A skill nobody has corroborated yet needs evidence
// gathering. A skill where the resume claims mastery and the interview
// answer showed none is a genuine conflict — more evidence is not
// obviously the remedy, and telling the user to go collect some would
// misrepresent what we found.

import { SkillConfidenceResult } from "./adaptiveConfidenceEngine";
import { computeAgreement, computeCoverage } from "./crossModalConsistency";

export type TriggerReason = "thin_evidence" | "conflicting_evidence";

export interface VerificationAction {
  /** Module the action would supply evidence for. */
  module: string;
  label: string;
  detail: string;
  href: string;
  /** Projected confidence increase, 0–1. */
  projectedGain: number;
}

export interface VerificationTrigger {
  skill: string;
  reason: TriggerReason;
  selfRating: number;
  currentConfidence: number;
  /** Best-first. Empty when nothing actionable remains. */
  actions: VerificationAction[];
}

/** Where a user goes to produce evidence for each module. */
const ACTION_FOR_MODULE: Record<string, Omit<VerificationAction, "projectedGain" | "module">> = {
  "Resume / Projects": {
    label: "Add it to your experience",
    detail: "Describe where you used this skill in a role or project",
    href: "/profile",
  },
  "Mock Interview": {
    label: "Answer a mock interview question",
    detail: "Demonstrate it in your own words",
    href: "/interviews",
  },
  "Certificates": {
    label: "Add a certificate",
    detail: "A verified certificate is the strongest evidence available",
    href: "/profile",
  },
  "Learning Activity": {
    label: "Open a learning resource",
    detail: "Shows active engagement with the skill",
    href: "/events",
  },
};

// Thresholds for firing. A high self-rating is the precondition: a user
// who rated themselves 2 and has no evidence isn't overclaiming, they're
// accurately reporting a gap, and prompting them would be noise.
const HIGH_SELF_RATING = 4;
const LOW_CONFIDENCE = 0.4;
const CONFLICT_AGREEMENT = 0.5;

/**
 * Recomputes confidence with one module raised to full evidence, holding
 * everything else fixed.
 *
 * BRI and the depth factor are held constant. That makes the projection
 * a conservative floor for the Resume module — supplying resume evidence
 * would also raise Skill Depth — which is the right direction to err in:
 * better to under-promise the gain than overstate it.
 */
function projectedConfidenceWith(
  result: SkillConfidenceResult,
  moduleName: string,
): number {
  const { bri, sds, modules } = result.breakdown;

  const hypothetical = modules.map(m =>
    m.name === moduleName ? { ...m, discountedEvidence: 1 } : m,
  );
  const evidential = hypothetical.filter(m => m.evidential);

  const agreement = computeAgreement(evidential.map(m => m.discountedEvidence));
  const coverage = computeCoverage(evidential);

  return agreement * bri * (0.4 + 0.6 * coverage) * (0.7 + 0.3 * sds);
}

/**
 * Decides whether a skill warrants a verification prompt, and what to
 * suggest. Returns null when the skill is fine or the prompt would be
 * noise.
 */
export function evaluateTrigger(result: SkillConfidenceResult): VerificationTrigger | null {
  const { selfRating, agreement, modules } = result.breakdown;

  if (selfRating < HIGH_SELF_RATING) return null;

  const evidential = modules.filter(m => m.evidential);
  const contributing = evidential.filter(m => m.discountedEvidence > 0);

  // Conflict is only meaningful once at least two sources have spoken —
  // Agreement returns 1 below that, so this can't fire spuriously.
  const conflicting = contributing.length >= 2 && agreement < CONFLICT_AGREEMENT;

  if (!conflicting && result.confidenceScore >= LOW_CONFIDENCE) return null;

  const actions: VerificationAction[] = evidential
    .filter(m => m.discountedEvidence < 1 && ACTION_FOR_MODULE[m.name])
    .map(m => ({
      module: m.name,
      ...ACTION_FOR_MODULE[m.name],
      projectedGain: Math.max(0, projectedConfidenceWith(result, m.name) - result.confidenceScore),
    }))
    .filter(a => a.projectedGain > 0.01)
    .sort((a, b) => b.projectedGain - a.projectedGain);

  return {
    skill: result.skill,
    reason: conflicting ? "conflicting_evidence" : "thin_evidence",
    selfRating,
    currentConfidence: result.confidenceScore,
    actions,
  };
}

/** Triggers across a whole career path, most severe first. */
export function detectVerificationTriggers(
  results: SkillConfidenceResult[],
): VerificationTrigger[] {
  return results
    .map(evaluateTrigger)
    .filter((t): t is VerificationTrigger => t !== null)
    // Conflicts first — a contradiction is a stronger signal than an
    // absence, and burying it under a list of unevidenced skills would
    // hide the more informative finding.
    .sort((a, b) => {
      if (a.reason !== b.reason) return a.reason === "conflicting_evidence" ? -1 : 1;
      return a.currentConfidence - b.currentConfidence;
    });
}
