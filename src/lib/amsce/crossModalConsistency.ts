// AMSCE — Cross-Modal Consistency Engine
//
// The core inventive mechanism: rather than averaging independent
// evidence signals about the same skill, this explicitly measures how
// much they agree with one another, and separately measures how stable
// the user's own self-assessment has been over time. Disagreement is
// preserved as a first-class output rather than smoothed away — a low
// Agreement score is meaningful information, not noise.
//
// ── ABSENCE IS NOT DISAGREEMENT ───────────────────────────────────────
//
// The first version of this engine computed Agreement across every
// module including the silent ones, which made a zero behave like a
// strong dissenting vote. The measurable consequence was that adding a
// verified certificate to a skill LOWERED its confidence — Agreement
// fell from 0.88 to 0.54 precisely because one module had found solid
// evidence while the others had none. The system punished users for
// having evidence, inverting the purpose of the whole pipeline.
//
// The error was epistemic, not arithmetic. A resume that doesn't mention
// Power BI is not evidence against Power BI skill; the user simply may
// not have listed it. "No data" and "contradicts" are different states
// and must be scored differently:
//
//   Agreement  — do the sources that SPOKE tell the same story?
//   Coverage   — how much of the available evidence base spoke at all?
//
// Splitting them keeps thin evidence honestly low (via Coverage) without
// making strong evidence in one modality self-defeating (via Agreement).

/**
 * Agreement across the evidence signals that actually carry data.
 *
 * 1 minus the mean pairwise absolute difference between contributing
 * signals. Near 1 means the sources that spoke concur; near 0 means they
 * genuinely conflict — for example a strong resume presence alongside a
 * mock-interview answer that showed no grasp of the same skill.
 *
 * Signals at zero are EXCLUDED: they abstained rather than dissented.
 * With fewer than two contributors there is nothing to contradict, so
 * the result is 1 and Coverage carries the uncertainty instead.
 */
export function computeAgreement(evidenceValues: number[]): number {
  const contributing = evidenceValues.filter(v => v > 0);
  const n = contributing.length;
  if (n < 2) return 1; // nothing to disagree with

  let totalDiff = 0;
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalDiff += Math.abs(contributing[i] - contributing[j]);
      pairs++;
    }
  }
  const meanDiff = pairs > 0 ? totalDiff / pairs : 0;
  return Math.max(0, 1 - meanDiff);
}

/**
 * Coverage: how much of the weighted evidence base actually produced
 * something, regardless of whether the sources agreed.
 *
 * This is where sparse evidence is penalised — the job Agreement used to
 * do by accident. A skill backed by one source out of five is genuinely
 * less certain than one corroborated across four, and Coverage says so
 * without implying the silent modules dissented.
 */
export function computeCoverage(
  modules: { weight: number; discountedEvidence: number }[],
): number {
  const totalWeight = modules.reduce((sum, m) => sum + m.weight, 0);
  if (totalWeight === 0) return 0;

  const covered = modules.reduce(
    (sum, m) => sum + m.weight * Math.min(1, m.discountedEvidence),
    0,
  );
  return Math.max(0, Math.min(1, covered / totalWeight));
}

/**
 * Behavioral Reliability Index: derived from the variance of a user's own
 * historical self-ratings for one skill. A rating that has stayed stable
 * across repeated self-assessments is more trustworthy than one that has
 * swung between extremes.
 *
 * With fewer than two data points this returns 1.0, not a "neutral" 0.5.
 * BRI is a RELIABILITY DISCOUNT — it should only bite where there is
 * actual evidence of instability. The old 0.5 prior meant a user who had
 * rated a skill once could never exceed 0.5 confidence however much
 * evidence they had, penalising them for the sparseness of our own data
 * rather than for anything about their skill. Absence of a track record
 * is not evidence of an unreliable one.
 */
export function computeBehavioralReliabilityIndex(ratingHistory: number[]): number {
  if (ratingHistory.length < 2) return 1;

  const mean = ratingHistory.reduce((a, b) => a + b, 0) / ratingHistory.length;
  const variance = ratingHistory.reduce((sum, r) => sum + (r - mean) ** 2, 0) / ratingHistory.length;

  const MAX_VARIANCE = 4; // ((5-1)/2)^2 — the maximum possible variance on a 1–5 scale
  return Math.max(0, Math.min(1, 1 - variance / MAX_VARIANCE));
}

/**
 * Skill Depth Score: how many ecosystem-related terms accompany the
 * skill in the user's own material, relative to that skill's expected
 * ecosystem breadth — distinguishing a richly-evidenced claim from one
 * supported by a single bare mention.
 */
export function computeSkillDepthScore(depthMatches: string[], expectedBreadth: number): number {
  return Math.min(1, depthMatches.length / (expectedBreadth + 1));
}
