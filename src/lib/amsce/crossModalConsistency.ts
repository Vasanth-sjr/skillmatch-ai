// AMSCE — Cross-Modal Consistency Engine (Phase 3)
//
// The core inventive mechanism: rather than averaging independent
// evidence signals about the same skill, this explicitly measures how
// much they agree with one another, and separately measures how stable
// the user's own self-assessment has been over time. Disagreement is
// preserved as a first-class output (via the Agreement score itself)
// rather than smoothed away — a low Agreement score is meaningful
// information, not noise to be averaged out.

/**
 * Agreement across M ≥ 2 independently-collected evidence signals:
 * 1 minus the mean pairwise absolute difference between every pair of
 * signals. Near 1 means every module's evidence roughly concurs; near 0
 * means they meaningfully disagree (e.g. strong resume presence but zero
 * interview engagement for the same skill).
 */
export function computeAgreement(evidenceValues: number[]): number {
  const n = evidenceValues.length;
  if (n < 2) return 1; // nothing to disagree with

  let totalDiff = 0;
  let pairs = 0;
  for (let i = 0; i < n; i++) {
    for (let j = i + 1; j < n; j++) {
      totalDiff += Math.abs(evidenceValues[i] - evidenceValues[j]);
      pairs++;
    }
  }
  const meanDiff = pairs > 0 ? totalDiff / pairs : 0;
  return Math.max(0, 1 - meanDiff);
}

/**
 * Behavioral Reliability Index: derived from the variance of a user's own
 * historical self-ratings for one skill. A rating that has stayed stable
 * across repeated self-assessments is treated as more trustworthy than
 * one that has swung between extremes. Fewer than 2 data points can't
 * establish reliability either way, so a neutral prior is returned.
 */
export function computeBehavioralReliabilityIndex(ratingHistory: number[]): number {
  if (ratingHistory.length < 2) return 0.5;

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
