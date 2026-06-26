export interface CandidateProfile {
  full_name: string | null;
  headline: string | null;
  bio: string | null;
  career_goal: string | null;
  skills: string[];
  experience: any[];
  projects: any[];
  certifications: any[];
  linkedin_url?: string | null;
  github_url?: string | null;
  portfolio_url?: string | null;
}

export interface JobRequirements {
  required_skills: string[];
  career_domain: string | null;
}

export interface FitBreakdown {
  total: number;
  skillsScore: number;      // 0–40
  domainScore: number;      // 0–20
  experienceScore: number;  // 0–20
  portfolioScore: number;   // 0–10
  completenessScore: number;// 0–10
  matchedSkills: string[];
  missingSkills: string[];
}

function normSkill(s: string): string {
  return s.toLowerCase().replace(/[\s.\-_]/g, "").replace(/js$/, "");
}

export function calcFitScore(candidate: CandidateProfile, job: JobRequirements): FitBreakdown {
  const candNorms = new Set((candidate.skills ?? []).map(normSkill));

  // 1. Skills match — 40 pts
  const required = job.required_skills ?? [];
  const matchedSkills = required.filter((s) => {
    const n = normSkill(s);
    return [...candNorms].some((c) => c === n || c.includes(n) || n.includes(c));
  });
  const missingSkills = required.filter((s) => !matchedSkills.includes(s));
  const skillsScore = required.length > 0
    ? Math.round((matchedSkills.length / required.length) * 40)
    : 20; // no required skills defined → give partial

  // 2. Career domain alignment — 20 pts
  const domainScore =
    candidate.career_goal && job.career_domain &&
    candidate.career_goal === job.career_domain
      ? 20 : 0;

  // 3. Experience depth — 20 pts
  const expCount = (candidate.experience ?? []).length;
  const experienceScore = expCount >= 2 ? 20 : expCount === 1 ? 12 : 0;

  // 4. Projects + Certifications — 10 pts
  const portfolioScore =
    ((candidate.projects ?? []).length >= 1 ? 5 : 0) +
    ((candidate.certifications ?? []).length >= 1 ? 5 : 0);

  // 5. Profile completeness — 10 pts
  const completenessChecks = [
    !!candidate.full_name,
    !!candidate.headline,
    !!candidate.bio,
    !!candidate.career_goal,
    (candidate.skills?.length ?? 0) >= 3,
    !!(candidate.linkedin_url || candidate.github_url || candidate.portfolio_url),
  ];
  const completenessScore = Math.round(
    (completenessChecks.filter(Boolean).length / completenessChecks.length) * 10
  );

  const total = Math.min(
    100,
    skillsScore + domainScore + experienceScore + portfolioScore + completenessScore
  );

  return {
    total, skillsScore, domainScore, experienceScore,
    portfolioScore, completenessScore, matchedSkills, missingSkills,
  };
}

export function getFitLabel(score: number): { label: string; color: string; bg: string } {
  if (score >= 80) return { label: "Excellent", color: "#10B981", bg: "bg-emerald-950/60" };
  if (score >= 65) return { label: "Strong",    color: "#0E7490", bg: "bg-cyan-950/60" };
  if (score >= 50) return { label: "Good",      color: "#3B82F6", bg: "bg-blue-950/60" };
  if (score >= 35) return { label: "Fair",      color: "#F59E0B", bg: "bg-amber-950/60" };
  return             { label: "Weak",       color: "#EF4444", bg: "bg-red-950/60" };
}
