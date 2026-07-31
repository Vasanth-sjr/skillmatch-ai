// AMSCE — Evidence Normalizer (Phase 3)
//
// Applies a time-based freshness discount to a raw [0,1] evidence value:
// FF(t) = exp(-ln(2)/halfLifeMonths * ageInMonths). Evidence with no
// known timestamp (e.g. project-only resume matches, which carry no
// date in the current schema) is left undiscounted rather than guessed
// at — we don't penalize what we genuinely don't know the age of.

const MS_PER_MONTH = 1000 * 60 * 60 * 24 * 30.44;

export function freshnessDiscount(rawValue: number, timestamp: string | null, halfLifeMonths: number): number {
  if (!timestamp || rawValue === 0) return rawValue;
  const ageMonths = Math.max(0, (Date.now() - new Date(timestamp).getTime()) / MS_PER_MONTH);
  const lambda = Math.log(2) / halfLifeMonths;
  return rawValue * Math.exp(-lambda * ageMonths);
}

// Half-lives per evidence type, matching the AMSCE invention disclosure:
// resume/project evidence ages more slowly than a verbal demonstration.
export const HALF_LIFE_MONTHS = {
  resume: 24,
  interview: 12,
  learning: 18,
} as const;
