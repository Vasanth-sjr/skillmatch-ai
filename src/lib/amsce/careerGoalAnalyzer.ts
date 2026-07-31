// AMSCE — Career Goal Alignment Analyzer (Phase 3)
//
// A skill core to the user's own declared career objective is stronger
// corroborating context than an unrelated one — this analyzer is a live
// re-evaluation of the current profile.career_goal, not stored evidence,
// so it carries no timestamp/freshness component of its own.

import { SKILL_POOLS } from "@/data/skillPools";
import { canonical } from "@/lib/skillVocabulary";
import { CareerPathKey } from "@/data/careerPaths";

export function analyzeCareerGoalAlignment(
  vocabTerms: string[],
  careerGoal: CareerPathKey | null,
): number {
  if (!careerGoal) return 0;

  const ownPool = (SKILL_POOLS[careerGoal] ?? []).map(canonical);
  if (vocabTerms.some(t => ownPool.includes(canonical(t)))) return 1.0;

  const anyPool = Object.values(SKILL_POOLS).flat().map(canonical);
  if (vocabTerms.some(t => anyPool.includes(canonical(t)))) return 0.3;

  return 0;
}
