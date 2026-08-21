// AMSCE — Interview Analyzer (Phase 2)
//
// Scores how substantively a candidate's typed Mock Interview answer
// engages with the specific skill(s) that question is tagged to. Reuses
// the same vocabulary-matching engine as the ATS Checker's Resume Context
// Analyzer, applied to a new input (interview answer text) it has never
// been applied to before — and reuses skillEcosystems.ts so a technically
// deep answer (mentioning several of a skill's related tools) scores
// higher than a shallow one that only repeats the skill's own name.
//
// This produces the raw per-skill evidence-strength values consumed by
// AMSCE's Evidence Normalizer and Cross-Modal Consistency Engine (Phase 3).
// It does not itself compute confidence — it only measures density.

import { textEvidencesTerm, canonicalTermsIn } from "./skillVocabulary";
import { getSkillEcosystem } from "@/data/skillEcosystems";

export interface SkillDensityScore {
  skill: string;
  density: number;        // 0–1, the evidence-strength value AMSCE will consume
  matchedTerms: string[]; // which vocabulary terms were actually found, for explainability
}

const MIN_WORDS_FOR_FULL_CREDIT = 40;

/**
 * Scores a single submitted answer against every skill the question is
 * tagged to. An answer under MIN_WORDS_FOR_FULL_CREDIT words is scaled
 * down proportionally — a one-line answer shouldn't score as high as a
 * substantive one even if it happens to name-drop the right term.
 */
export function scoreInterviewAnswer(answer: string, skills: string[]): SkillDensityScore[] {
  const wordCount = answer.trim().split(/\s+/).filter(Boolean).length;
  const lengthFactor = Math.min(1, wordCount / MIN_WORDS_FOR_FULL_CREDIT);

  // Extracted once: matching every candidate term against the answer
  // individually would rescan the whole vocabulary per term.
  const answerTerms = canonicalTermsIn(answer);

  return skills.map(skill => {
    const eco = getSkillEcosystem(skill);
    const candidateTerms = [skill, ...eco.related];

    const matchedTerms = candidateTerms.filter(term => textEvidencesTerm(answer, term, answerTerms));
    const breadth = Math.min(1, matchedTerms.length / (eco.expected + 1));
    const density = Math.round(breadth * lengthFactor * 100) / 100;

    return { skill, density, matchedTerms };
  });
}
