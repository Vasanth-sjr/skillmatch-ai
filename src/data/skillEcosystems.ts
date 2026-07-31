// Skill-ecosystem adjacency map for AMSCE's Skill Depth Score (Phase 3).
// Maps a normalized skill term to the related tools/libraries commonly
// used alongside it, plus an "expected" breadth constant — the number of
// related terms that, if also found in a candidate's material, counts as
// full evidentiary depth for that skill (rather than a bare single mention).
//
// Keys are normalized the same way as ATSChecker's norm()/canonical():
// lowercased, punctuation stripped except + and #.
//
// Not every vocabulary term needs an entry — skills without one fall back
// to a default expected breadth in the AMSCE Skill Depth Analysis logic.

export interface SkillEcosystem {
  related: string[];
  expected: number;
}

export const SKILL_ECOSYSTEMS: Record<string, SkillEcosystem> = {
  // ── Languages ──────────────────────────────────────────────────────────
  python:     { related: ["flask", "fastapi", "django", "numpy", "pandas", "pytorch", "scikitlearn", "tensorflow"], expected: 5 },
  javascript: { related: ["react", "nodejs", "express", "typescript", "webpack", "vite", "jquery"], expected: 4 },
  typescript: { related: ["react", "nodejs", "nextjs", "nestjs", "prisma"], expected: 3 },
  java:       { related: ["springboot", "hibernate", "maven", "gradle", "junit"], expected: 3 },
  go:         { related: ["gin", "fiber", "docker", "kubernetes"], expected: 3 },
  csharp:     { related: ["dotnet", "aspnet", "entityframework"], expected: 3 },

  // ── Frontend ────────────────────────────────────────────────────────────
  react:      { related: ["redux", "reactrouter", "nextjs", "tailwind", "vite", "reactquery"], expected: 4 },
  vue:        { related: ["vuex", "nuxtjs", "vite"], expected: 3 },
  angular:    { related: ["rxjs", "typescript", "ngrx"], expected: 3 },
  nextjs:     { related: ["react", "vercel", "tailwind", "prisma"], expected: 3 },
  css:        { related: ["sass", "tailwind", "flexbox", "grid", "bootstrap"], expected: 3 },
  html:       { related: ["css", "javascript", "accessibility"], expected: 2 },

  // ── Backend ─────────────────────────────────────────────────────────────
  nodejs:     { related: ["express", "nestjs", "npm", "mongodb", "postgresql"], expected: 4 },
  express:    { related: ["nodejs", "mongodb", "restapi", "jwt"], expected: 3 },
  django:     { related: ["python", "postgresql", "restapi", "celery"], expected: 3 },
  fastapi:    { related: ["python", "pydantic", "uvicorn"], expected: 3 },
  postgresql: { related: ["sql", "supabase", "prisma", "orm"], expected: 3 },
  mongodb:    { related: ["mongoose", "nodejs", "nosql"], expected: 3 },
  supabase:   { related: ["postgresql", "react", "auth", "rls"], expected: 3 },
  restapi:    { related: ["nodejs", "express", "postman", "swagger"], expected: 3 },
  graphql:    { related: ["apollo", "restapi", "nodejs"], expected: 3 },

  // ── Cloud / DevOps ──────────────────────────────────────────────────────
  aws:        { related: ["ec2", "s3", "lambda", "cloudformation", "iam"], expected: 4 },
  docker:     { related: ["kubernetes", "cicd", "linux", "containers"], expected: 3 },
  kubernetes: { related: ["docker", "helm", "terraform", "aws"], expected: 3 },
  terraform:  { related: ["aws", "azure", "gcp", "iac"], expected: 3 },
  linux:      { related: ["bash", "shell", "docker", "networking"], expected: 3 },
  cicd:       { related: ["githubactions", "jenkins", "docker"], expected: 3 },

  // ── Data / ML ───────────────────────────────────────────────────────────
  sql:            { related: ["postgresql", "mysql", "querytuning", "joins"], expected: 3 },
  pandas:         { related: ["numpy", "python", "matplotlib", "jupyter"], expected: 3 },
  numpy:          { related: ["pandas", "python", "scipy"], expected: 2 },
  tensorflow:     { related: ["keras", "python", "numpy", "mlops"], expected: 3 },
  pytorch:        { related: ["python", "numpy", "huggingface"], expected: 3 },
  scikitlearn:    { related: ["python", "pandas", "numpy"], expected: 3 },
  tableau:        { related: ["sql", "datavisualization", "powerbi"], expected: 2 },
  powerbi:        { related: ["sql", "excel", "datavisualization"], expected: 2 },
  machinelearning:{ related: ["python", "tensorflow", "pytorch", "scikitlearn", "statistics"], expected: 4 },

  // ── Mobile ──────────────────────────────────────────────────────────────
  reactnative: { related: ["react", "expo", "javascript", "typescript"], expected: 3 },
  flutter:     { related: ["dart", "firebase", "androidstudio"], expected: 3 },
  swift:       { related: ["ios", "xcode", "swiftui"], expected: 3 },
  kotlin:      { related: ["android", "androidstudio", "jetpackcompose"], expected: 3 },

  // ── Cybersecurity ───────────────────────────────────────────────────────
  penetrationtesting: { related: ["burpsuite", "nmap", "metasploit", "owasp"], expected: 3 },
  networking:         { related: ["tcpip", "dns", "linux", "wireshark"], expected: 3 },
  cryptography:       { related: ["ssl", "tls", "encryption"], expected: 2 },

  // ── Design ──────────────────────────────────────────────────────────────
  figma:      { related: ["prototyping", "designsystems", "userresearch"], expected: 2 },
  uxresearch: { related: ["figma", "usabilitytesting", "personas"], expected: 2 },

  // ── Tools / Practices ───────────────────────────────────────────────────
  git: { related: ["github", "gitlab", "cicd"], expected: 2 },
};

const DEFAULT_EXPECTED_BREADTH = 3;

function normSkill(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#]/g, "");
}

/**
 * Returns the ecosystem entry for a skill, or a sensible default
 * (no known related terms, default expected breadth) if the skill
 * hasn't been explicitly mapped yet.
 */
export function getSkillEcosystem(skill: string): SkillEcosystem {
  const key = normSkill(skill);
  return SKILL_ECOSYSTEMS[key] ?? { related: [], expected: DEFAULT_EXPECTED_BREADTH };
}
