// AMSCE — Resume Context Analyzer (Phase 3)
//
// Determines whether a rated skill is evidenced in the user's own profile
// data — specifically whether it appears merely in the flat skills list,
// or within the actual text of an Experience or Project entry (materially
// stronger evidence, per the same context-aware-placement principle the
// ATS Checker already applies to uploaded resumes).
//
// This deliberately analyzes the user's PERSISTED PROFILE (skills,
// experience, projects) rather than requiring a fresh resume upload —
// profile data is itself the structured, always-available equivalent of
// resume content, and using it means this evidence source doesn't depend
// on the user having separately run the ATS Checker.

import { textEvidencesTerm, canonicalTermsIn } from "@/lib/skillVocabulary";
import { getSkillEcosystem } from "@/data/skillEcosystems";

export interface ExperienceEntry {
  title?: string;
  description?: string;
  current?: boolean;
  startYear?: string;
  endYear?: string;
}

export interface ProjectEntry {
  title?: string;
  description?: string;
  techStack?: string[] | string;
}

export interface ResumeContextEvidence {
  presence: number;          // 0 (absent) | 0.4 (skills list only) | 1.0 (in experience/project context)
  timestamp: string | null;  // most recent supporting experience entry's year, if any — projects carry no date in the current schema, so project-only evidence is undated
  depthMatches: string[];    // ecosystem-related terms found in the same context text, feeding Skill Depth Score
}

function stackToText(stack: string[] | string | undefined): string {
  if (!stack) return "";
  return Array.isArray(stack) ? stack.join(" ") : stack;
}

export function analyzeResumeContext(
  vocabTerms: string[],
  profileSkills: string[],
  experience: ExperienceEntry[],
  projects: ProjectEntry[],
): ResumeContextEvidence {
  // Canonical matching, so a profile written as "Power BI" matches the
  // compact "powerbi" the skill map supplies. Direct substring matching
  // alone missed every multi-word skill.
  const matchesAny = (text: string) => {
    const textTerms = canonicalTermsIn(text);
    return vocabTerms.some(term => textEvidencesTerm(text, term, textTerms));
  };

  const inSkillsList = matchesAny(profileSkills.join(" "));

  let contextText = "";
  let mostRecentYear: number | null = null;

  for (const exp of experience) {
    const text = `${exp.title ?? ""} ${exp.description ?? ""}`;
    if (matchesAny(text)) {
      contextText += " " + text;
      const year = exp.current
        ? new Date().getFullYear()
        : parseInt(exp.endYear || exp.startYear || "0", 10);
      if (year && (!mostRecentYear || year > mostRecentYear)) mostRecentYear = year;
    }
  }

  for (const proj of projects) {
    const text = `${proj.title ?? ""} ${proj.description ?? ""} ${stackToText(proj.techStack)}`;
    if (matchesAny(text)) {
      contextText += " " + text;
      // Projects carry no date field in the current schema — this
      // evidence contributes to presence/depth but not to freshness.
    }
  }

  const inContext = contextText.trim().length > 0;
  const presence = inContext ? 1.0 : inSkillsList ? 0.4 : 0;

  // Skill Depth: union of every mapped term's related-ecosystem terms,
  // checked against whichever text actually carried the match.
  const searchText = (inContext ? contextText : profileSkills.join(" "));
  const searchTerms = canonicalTermsIn(searchText);
  const relatedTerms = Array.from(new Set(vocabTerms.flatMap(t => getSkillEcosystem(t).related)));
  const depthMatches = relatedTerms.filter(term => textEvidencesTerm(searchText, term, searchTerms));

  return {
    presence,
    timestamp: mostRecentYear ? `${mostRecentYear}-06-30` : null,
    depthMatches,
  };
}
