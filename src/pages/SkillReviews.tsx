import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { resolveSkillVocabTerms } from "@/data/skillLabelMap";
import { canonical } from "@/lib/skillVocabulary";
import {
  computeSkillConfidence,
  SkillConfidenceResult,
  ConfidenceState,
  InterviewEvidenceInput,
  LearningEvidenceInput,
} from "@/lib/amsce/adaptiveConfidenceEngine";
import { ExperienceEntry, ProjectEntry } from "@/lib/amsce/resumeContextAnalyzer";
import { loadCertificateEvidence } from "@/lib/certificates/certificateEvidence";
import { detectVerificationTriggers, VerificationTrigger } from "@/lib/amsce/verificationTrigger";
import { recordTriggers, markTriggerActed, loadTriggerLog, TriggerLogRow } from "@/lib/amsce/triggerLog";
import { VerificationPrompts } from "@/components/skills/VerificationPrompts";
import { cn } from "@/lib/utils";
import { Star, TrendingUp, AlertCircle, CheckCircle2, RefreshCw, Loader2, ChevronDown } from "lucide-react";

// ─── Skill areas per career path ─────────────────────────────────────────────
// 5 categories × 4 skills = 20 assessable skills per path

type SkillAreaMap = Record<CareerPathKey, { category: string; skills: string[] }[]>;

const PATH_SKILLS: SkillAreaMap = {
  frontend_dev: [
    { category: "HTML & CSS",       skills: ["Semantic HTML5", "CSS Layouts (Flex/Grid)", "Responsive Design", "CSS Animations"] },
    { category: "JavaScript",       skills: ["ES6+ JavaScript", "TypeScript", "Async/Await & Promises", "DOM & Events"] },
    { category: "React Ecosystem",  skills: ["Components & Hooks", "State Management", "React Router", "Next.js / SSR"] },
    { category: "Tooling",          skills: ["Git & GitHub", "Webpack / Vite", "Testing (Jest/RTL)", "Browser DevTools"] },
    { category: "Design & Quality", skills: ["Figma Basics", "Accessibility (a11y)", "Performance Optimization", "Cross-browser Compat"] },
  ],
  backend_dev: [
    { category: "Server Languages",  skills: ["Node.js", "Python", "Go / Rust / Java"] },
    { category: "API Design",        skills: ["REST API Design", "GraphQL", "Auth (JWT/OAuth)", "API Security"] },
    { category: "Databases",         skills: ["SQL & Query Tuning", "NoSQL (MongoDB/Redis)", "Database Design & ORMs", "Caching"] },
    { category: "Architecture",      skills: ["Microservices", "System Design", "Message Queues", "Load Balancing"] },
    { category: "DevOps Basics",     skills: ["Docker", "Linux & Shell", "CI/CD Basics", "Cloud (AWS/GCP)"] },
  ],
  fullstack_dev: [
    { category: "Frontend",      skills: ["React / Vue", "TypeScript", "CSS & Styling", "State Management"] },
    { category: "Backend",       skills: ["Node.js / Python", "REST & GraphQL", "Authentication", "Database Design"] },
    { category: "Databases",     skills: ["PostgreSQL / MySQL", "MongoDB / Redis", "ORMs", "Migrations"] },
    { category: "DevOps",        skills: ["Docker", "CI/CD Pipelines", "Cloud Deploy", "Git Workflows"] },
    { category: "Architecture",  skills: ["System Design", "API Design", "Performance Tuning", "Security Basics"] },
  ],
  ui_ux_designer: [
    { category: "Design Tools",   skills: ["Figma", "Prototyping Tools", "Design Systems", "Asset Libraries"] },
    { category: "UX Research",    skills: ["User Interviews", "Usability Testing", "Persona Creation", "Journey Mapping"] },
    { category: "Visual Design",  skills: ["Typography", "Color Theory", "Layout & Spacing", "Motion Design"] },
    { category: "Product Skills", skills: ["Wireframing", "Information Architecture", "Design Handoff", "Accessibility (WCAG)"] },
    { category: "Soft Skills",    skills: ["Stakeholder Comms", "Design Critique", "Agile Collaboration", "Presentation"] },
  ],
  data_analyst: [
    { category: "Core Languages",     skills: ["SQL (Advanced)", "Python (Pandas/NumPy)", "R Basics"] },
    { category: "Visualization",      skills: ["Tableau", "Power BI", "Matplotlib/Seaborn", "Excel / Sheets"] },
    { category: "Statistics",         skills: ["Descriptive Stats", "Hypothesis Testing", "Regression Analysis", "A/B Testing"] },
    { category: "Data Engineering",   skills: ["ETL Pipelines", "Data Warehousing", "BigQuery/Redshift", "Airflow Basics"] },
    { category: "Business Intel",     skills: ["KPI Definition", "Dashboard Design", "Storytelling with Data", "Stakeholder Reporting"] },
  ],
  ml_engineer: [
    { category: "Foundations",   skills: ["Python (NumPy/Pandas)", "Linear Algebra & Calculus", "Statistics & Probability", "Feature Engineering"] },
    { category: "ML Frameworks", skills: ["Scikit-learn", "TensorFlow / Keras", "PyTorch", "Hugging Face"] },
    { category: "Model Types",   skills: ["Classical ML (Tree-based)", "Deep Learning", "NLP & Transformers", "Computer Vision"] },
    { category: "MLOps",         skills: ["Model Training & Tuning", "Experiment Tracking", "Model Deployment", "Monitoring & Drift"] },
    { category: "Cloud & Scale", skills: ["AWS SageMaker / GCP Vertex", "Docker for ML", "Distributed Training", "Data Pipelines"] },
  ],
  product_manager: [
    { category: "Strategy",      skills: ["Roadmapping", "OKRs & Goal Setting", "Market Research", "Competitive Analysis"] },
    { category: "User Research", skills: ["User Interviews", "Survey Design", "A/B Testing", "Journey Mapping"] },
    { category: "Execution",     skills: ["Agile / Scrum", "PRD Writing", "Prioritization Frameworks", "Sprint Planning"] },
    { category: "Analytics",     skills: ["Product Metrics (DAU/MAU)", "SQL Basics", "Analytics Tools", "Data-driven Decisions"] },
    { category: "Collaboration", skills: ["Stakeholder Mgmt", "Design Collab", "Eng Partnership", "Go-to-Market Planning"] },
  ],
  devops_cloud: [
    { category: "Cloud Platforms",  skills: ["AWS Core Services", "GCP / Azure", "Cloud Networking", "IAM & Security"] },
    { category: "Containers",       skills: ["Docker", "Kubernetes", "Helm Charts", "Service Mesh (Istio)"] },
    { category: "Infrastructure",   skills: ["Terraform", "Ansible / Puppet", "CloudFormation", "Config Management"] },
    { category: "CI/CD",            skills: ["GitHub Actions / Jenkins", "Build Pipelines", "Automated Testing", "Deployment Strategies"] },
    { category: "Monitoring & SRE", skills: ["Prometheus & Grafana", "Log Mgmt (ELK)", "SLOs & SLAs", "Incident Response"] },
  ],
  cybersecurity: [
    { category: "Foundations",    skills: ["Networking (TCP/IP, DNS)", "Linux & CLI", "Cryptography Basics", "CIA Triad"] },
    { category: "Offensive Sec",  skills: ["Penetration Testing", "Vulnerability Scanning", "OWASP Top 10", "Exploit Basics"] },
    { category: "Defensive Sec",  skills: ["SIEM (Splunk)", "Threat Hunting", "Incident Response", "Log Analysis"] },
    { category: "Compliance",     skills: ["ISO 27001 / SOC2", "GDPR Basics", "Risk Assessment", "Security Policies"] },
    { category: "Tools",          skills: ["Burp Suite / Nmap", "Wireshark", "Metasploit Basics", "CEH / Security+"] },
  ],
  mobile_dev: [
    { category: "Cross-Platform",      skills: ["React Native", "Flutter / Dart", "Expo", "Cross-platform State"] },
    { category: "Native Concepts",     skills: ["iOS (Swift basics)", "Android (Kotlin basics)", "App Lifecycle", "Native Modules"] },
    { category: "UI & UX",            skills: ["Mobile UI Components", "Navigation Patterns", "Animations", "HIG / Material"] },
    { category: "Backend & Data",      skills: ["REST APIs", "Firebase / Supabase", "Push Notifications", "Offline Storage"] },
    { category: "Publishing",          skills: ["App Store Deploy", "Play Store Deploy", "App Signing", "Performance Profiling"] },
  ],
};

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  0: { label: "Not rated", color: "text-[--ag-muted]" },
  1: { label: "Never heard of it", color: "text-[--ag-danger]" },
  2: { label: "Know the basics",   color: "text-orange-400" },
  3: { label: "Built with it",     color: "text-[--ag-warning]" },
  4: { label: "Comfortable",       color: "text-[--ag-accent]" },
  5: { label: "Could teach it",    color: "text-[--ag-success]" },
};

type Ratings = Record<string, number>; // skill → most recent 1-5 rating
type RatingHistories = Record<string, number[]>; // skill → every rating ever given, oldest first

// Ratings persist to skill_rating_history — an append-only table, not a
// single overwritten value — so every self-assessment event is retained.
// This is what lets AMSCE compute a Behavioral Reliability Index from how
// stable a user's self-ratings have been over time.

async function loadRatingData(userId: string, path: string): Promise<{ current: Ratings; histories: RatingHistories }> {
  const { data } = await (supabase as any)
    .from("skill_rating_history")
    .select("skill, rating, rated_at")
    .eq("user_id", userId)
    .eq("career_path", path)
    .order("rated_at", { ascending: true });

  const current: Ratings = {};
  const histories: RatingHistories = {};
  for (const row of data ?? []) {
    current[row.skill] = row.rating;
    (histories[row.skill] ??= []).push(row.rating);
  }
  return { current, histories };
}

async function insertRating(userId: string, path: string, skill: string, rating: number) {
  return (supabase as any).from("skill_rating_history").insert({
    user_id: userId,
    career_path: path,
    skill,
    rating,
    rated_at: new Date().toISOString(),
  });
}

async function clearRatingHistory(userId: string, path: string) {
  return (supabase as any)
    .from("skill_rating_history")
    .delete()
    .eq("user_id", userId)
    .eq("career_path", path);
}

// AMSCE evidence loaders — Mock Interview and Learning Activity evidence are
// stored keyed by the compact technical vocabulary (e.g. "react", "docker"),
// not by the human-readable Skill Reviews label, so each is grouped by that
// raw key here and reconciled against a skill's resolved vocab terms by the
// caller (see resolveSkillVocabTerms in skillLabelMap.ts).

async function loadInterviewEvidence(userId: string, path: string): Promise<Record<string, InterviewEvidenceInput[]>> {
  const { data } = await (supabase as any)
    .from("interview_answer_analysis")
    .select("skill, density, answered_at")
    .eq("user_id", userId)
    .eq("career_path", path);

  const bySkill: Record<string, InterviewEvidenceInput[]> = {};
  for (const row of data ?? []) {
    (bySkill[row.skill] ??= []).push({ density: row.density, answeredAt: row.answered_at });
  }
  return bySkill;
}

async function loadLearningEvidence(userId: string, path: string): Promise<{ tags: string[]; engagedAt: string }[]> {
  const { data } = await (supabase as any)
    .from("learning_resource_engagement")
    .select("skill_tags, engaged_at")
    .eq("user_id", userId)
    .eq("career_path", path);

  return (data ?? []).map((row: any) => ({
    tags: ((row.skill_tags ?? []) as string[]).map(canonical),
    engagedAt: row.engaged_at,
  }));
}

async function persistConfidenceScores(userId: string, path: string, results: SkillConfidenceResult[]) {
  if (results.length === 0) return { error: null };
  const rows = results.map(r => ({
    user_id: userId,
    career_path: path,
    skill: r.skill,
    skill_score: r.skillScore,
    confidence_score: r.confidenceScore,
    confidence_state: r.confidenceState,
    explainability: r.explainability,
    evidence_breakdown: r.breakdown,
    last_computed_at: new Date().toISOString(),
  }));
  return (supabase as any)
    .from("skill_confidence_scores")
    .upsert(rows, { onConflict: "user_id,career_path,skill" });
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function RatingButton({ value, active, disabled, onClick }: { value: number; active: boolean; disabled: boolean; onClick: () => void }) {
  const colors: Record<number, string> = {
    1: active ? "bg-[--ag-danger]   border-[--ag-danger]   text-white" : "border-[--ag-danger]/40   text-[--ag-danger]/70   hover:bg-[--ag-danger]/10",
    2: active ? "bg-orange-500      border-orange-500       text-white" : "border-orange-400/40      text-orange-400/70      hover:bg-orange-400/10",
    3: active ? "bg-[--ag-warning]  border-[--ag-warning]  text-white" : "border-[--ag-warning]/40  text-[--ag-warning]/70  hover:bg-[--ag-warning]/10",
    4: active ? "bg-[--ag-accent]   border-[--ag-accent]   text-white" : "border-[--ag-accent]/40   text-[--ag-accent]/70   hover:bg-[--ag-accent]/10",
    5: active ? "bg-[--ag-success]  border-[--ag-success]  text-white" : "border-[--ag-success]/40  text-[--ag-success]/70  hover:bg-[--ag-success]/10",
  };
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "w-7 h-7 text-xs font-extrabold border transition-all flex items-center justify-center shrink-0",
        disabled && "opacity-40 cursor-wait",
        colors[value],
      )}
      title={RATING_LABELS[value].label}
    >
      {value}
    </button>
  );
}

function confidenceBadgeClasses(state: ConfidenceState): string {
  switch (state) {
    case "High":   return "bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]";
    case "Medium": return "bg-[--ag-warning]/10 border-[--ag-warning]/40 text-[--ag-warning]";
    default:       return "bg-[--ag-danger]/10  border-[--ag-danger]/40  text-[--ag-danger]";
  }
}

function SkillRow({
  skill, rating, savingSkill, onRate, confidence, computing,
}: {
  skill: string;
  rating: number;
  savingSkill: string | null;
  onRate: (skill: string, val: number) => void;
  confidence?: SkillConfidenceResult;
  computing: boolean;
}) {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className="px-4 py-3">
      <div className="flex items-center gap-3">
        <div className="flex-1 min-w-0">
          <p className="text-sm text-[--ag-text] font-medium truncate">{skill}</p>
          {rating > 0 && (
            <p className={cn("text-xs mt-0.5", RATING_LABELS[rating].color)}>{RATING_LABELS[rating].label}</p>
          )}
        </div>
        <div className="flex gap-1 shrink-0">
          {[1, 2, 3, 4, 5].map(v => (
            <RatingButton
              key={v}
              value={v}
              active={rating === v}
              disabled={savingSkill === skill}
              onClick={() => onRate(skill, v)}
            />
          ))}
        </div>
      </div>

      {rating > 0 && (
        computing && !confidence ? (
          <p className="mt-2 text-[11px] text-[--ag-muted] flex items-center gap-1.5">
            <Loader2 className="h-3 w-3 animate-spin" /> Calibrating against your evidence…
          </p>
        ) : confidence ? (
          <div className="mt-2">
            <button
              onClick={() => setExpanded(e => !e)}
              className="flex items-center gap-2"
            >
              <span className={cn("text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 border", confidenceBadgeClasses(confidence.confidenceState))}>
                {confidence.confidenceState} confidence
              </span>
              <span className="text-[11px] font-['JetBrains_Mono'] text-[--ag-muted]">
                AMSCE {confidence.skillScore.toFixed(1)}/5
              </span>
              <ChevronDown className={cn("h-3 w-3 text-[--ag-muted] transition-transform", expanded && "rotate-180")} />
            </button>
            {expanded && (
              <ul className="mt-2 space-y-1 border-l-2 border-[--ag-border] pl-3">
                {confidence.explainability.map((line, i) => (
                  <li key={i} className="text-[11px] text-[--ag-muted]">{line}</li>
                ))}
              </ul>
            )}
          </div>
        ) : null
      )}
    </div>
  );
}

function CategoryBlock({
  category, skills, ratings, savingSkill, onRate, confidence, computing,
}: {
  category: string;
  skills: string[];
  ratings: Ratings;
  savingSkill: string | null;
  onRate: (skill: string, val: number) => void;
  confidence: Record<string, SkillConfidenceResult>;
  computing: boolean;
}) {
  const scores = skills.map(s => ratings[s] ?? 0).filter(v => v > 0);
  const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
  const pct = Math.round((avg / 5) * 100);

  return (
    <div className="bg-[--ag-bg] border border-[--ag-border] overflow-hidden">
      {/* Category header */}
      <div className="px-4 py-3 bg-[--ag-surface] border-b border-[--ag-border] flex items-center justify-between">
        <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-text]">{category}</p>
        {scores.length > 0 && (
          <div className="flex items-center gap-2">
            <div className="w-20 h-1.5 bg-[--ag-border]">
              <div
                className={cn("h-full transition-all duration-500",
                  avg >= 4 ? "bg-[--ag-success]" : avg >= 3 ? "bg-[--ag-accent]" : avg >= 2 ? "bg-[--ag-warning]" : "bg-[--ag-danger]"
                )}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs font-['JetBrains_Mono'] font-bold text-[--ag-muted]">{avg.toFixed(1)}/5</span>
          </div>
        )}
      </div>

      {/* Skills */}
      <div className="divide-y divide-[--ag-border]">
        {skills.map(skill => (
          <SkillRow
            key={skill}
            skill={skill}
            rating={ratings[skill] ?? 0}
            savingSkill={savingSkill}
            onRate={onRate}
            confidence={confidence[skill]}
            computing={computing}
          />
        ))}
      </div>
    </div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function SkillReviews() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [selectedPath, setSelectedPath] = useState<CareerPathKey>(
    (profile?.career_goal as CareerPathKey) ?? "frontend_dev",
  );
  const [ratings, setRatings] = useState<Ratings>({});
  const [histories, setHistories] = useState<RatingHistories>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState<string | null>(null); // skill currently being saved

  const [confidence, setConfidence] = useState<Record<string, SkillConfidenceResult>>({});
  const [computing, setComputing] = useState(false);
  const [triggers, setTriggers] = useState<VerificationTrigger[]>([]);
  const [triggerLog, setTriggerLog] = useState<Record<string, TriggerLogRow>>({});

  // Stable identity for the certificate list, so adding or verifying a
  // certificate triggers a recompute without the array's changing
  // reference causing one on every render.
  const certificationsKey = JSON.stringify(
    ((profile as any)?.certifications ?? []).map((c: any) =>
      [c.id, c.name, c.issuer, c.credentialId, c.issueDate, c.expiryDate].join("|")),
  );

  // Sync path from profile on load
  useEffect(() => {
    if (profile?.career_goal) setSelectedPath(profile.career_goal as CareerPathKey);
  }, [profile?.career_goal]);

  // Load rating history when path or user changes
  useEffect(() => {
    if (!user) return;
    setLoading(true);
    setConfidence({});
    setTriggers([]);
    loadTriggerLog(user.id, selectedPath).then(setTriggerLog);
    loadRatingData(user.id, selectedPath)
      .then(({ current, histories }) => { setRatings(current); setHistories(histories); })
      .catch(err => {
        console.error("Failed to load skill rating history:", err);
        toast({ title: "Couldn't load ratings", description: String(err?.message ?? err), variant: "destructive" });
      })
      .finally(() => setLoading(false));
  }, [user, selectedPath]);

  // AMSCE — recompute calibrated confidence for every rated skill whenever
  // ratings, rating history, or the selected path change. Deterministic and
  // cheap enough to simply recompute in full rather than diff incrementally.
  useEffect(() => {
    if (!user || loading) return;

    const areas = PATH_SKILLS[selectedPath];
    const allSkills = areas.flatMap(a => a.skills);
    const skillsToScore = allSkills.filter(s => (ratings[s] ?? 0) > 0);

    if (skillsToScore.length === 0) {
      setConfidence({});
      return;
    }

    let cancelled = false;
    setComputing(true);

    (async () => {
      try {
        // Certificates are path-independent: a Power BI certificate is
        // evidence for that skill whichever career path is being viewed.
        const [interviewBySkill, learningRows, certificates] = await Promise.all([
          loadInterviewEvidence(user.id, selectedPath),
          loadLearningEvidence(user.id, selectedPath),
          loadCertificateEvidence(user.id, (profile as any)?.certifications ?? []),
        ]);
        if (cancelled) return;

        const profileSkills = profile?.skills ?? [];
        const experience = (profile?.experience ?? []) as ExperienceEntry[];
        const projects = ((profile as any)?.projects ?? []) as ProjectEntry[];
        const careerGoal = (profile?.career_goal as CareerPathKey) ?? null;

        const results: SkillConfidenceResult[] = skillsToScore.map(skill => {
          const vocabTerms = resolveSkillVocabTerms(skill);
          const interviewEvidence = vocabTerms.flatMap(t => interviewBySkill[t] ?? []);
          const learningEvidence: LearningEvidenceInput[] = learningRows
            .filter(row => vocabTerms.some(t => row.tags.includes(t)))
            .map(row => ({ engagedAt: row.engagedAt }));

          return computeSkillConfidence({
            skillLabel: skill,
            selfRating: ratings[skill],
            ratingHistory: histories[skill] ?? [ratings[skill]],
            careerGoal,
            profileSkills,
            experience,
            projects,
            interviewEvidence,
            learningEvidence,
            certificates,
          });
        });

        if (cancelled) return;

        const next: Record<string, SkillConfidenceResult> = {};
        for (const r of results) next[r.skill] = r;
        setConfidence(next);

        // Verification Trigger: decide what the user should do about any
        // skill whose self-rating outruns its evidence.
        const fired = detectVerificationTriggers(results);
        setTriggers(fired);
        recordTriggers(user.id, selectedPath, fired);

        const { error } = await persistConfidenceScores(user.id, selectedPath, results);
        if (error) {
          console.error("Failed to persist skill confidence scores:", error);
          toast({ title: "Confidence scores not saved", description: error.message, variant: "destructive" });
        }
      } catch (err: any) {
        console.error("AMSCE confidence computation failed:", err);
        toast({ title: "Couldn't compute confidence scores", description: String(err?.message ?? err), variant: "destructive" });
      } finally {
        if (!cancelled) setComputing(false);
      }
    })();

    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
    // Serialized rather than passed by reference: the certifications array
    // is rebuilt on every profile fetch, so depending on it directly would
    // re-run this effect (and re-upsert) on every render.
  }, [user, selectedPath, loading, ratings, histories, certificationsKey]);

  const rate = async (skill: string, val: number) => {
    if (!user || val === ratings[skill]) return; // no-op on re-clicking the same value
    setSaving(skill);
    const { error } = await insertRating(user.id, selectedPath, skill, val);
    if (error) {
      console.error("Failed to save rating:", error);
      toast({ title: "Rating not saved", description: error.message, variant: "destructive" });
    } else {
      setRatings(prev => ({ ...prev, [skill]: val }));
      setHistories(prev => ({ ...prev, [skill]: [...(prev[skill] ?? []), val] }));
    }
    setSaving(null);
  };

  const resetAll = async () => {
    if (!user) return;
    const { error } = await clearRatingHistory(user.id, selectedPath);
    if (error) {
      console.error("Failed to reset ratings:", error);
      toast({ title: "Reset failed", description: error.message, variant: "destructive" });
    } else {
      setRatings({});
      setHistories({});
      setConfidence({});
    }
  };

  const areas = PATH_SKILLS[selectedPath];
  const allSkills = areas.flatMap(a => a.skills);
  const rated = allSkills.filter(s => (ratings[s] ?? 0) > 0);
  const totalRated = rated.length;
  const totalSkills = allSkills.length;

  const allScores = rated.map(s => ratings[s]);
  const overallAvg = allScores.length ? allScores.reduce((a, b) => a + b, 0) / allScores.length : 0;
  const overallPct = Math.round((overallAvg / 5) * 100);

  // Focus areas = lowest-rated skills (rated 1 or 2)
  const focusAreas = allSkills
    .filter(s => ratings[s] > 0 && ratings[s] <= 2)
    .sort((a, b) => ratings[a] - ratings[b])
    .slice(0, 5);

  // Strengths = rated 4 or 5
  const strengths = allSkills.filter(s => ratings[s] >= 4);

  const goalPath = CAREER_PATHS[selectedPath];
  const completionPct = Math.round((totalRated / totalSkills) * 100);

  const overallGrade =
    overallAvg >= 4.5 ? "S" :
    overallAvg >= 4   ? "A" :
    overallAvg >= 3   ? "B" :
    overallAvg >= 2   ? "C" : "D";

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6 space-y-6 pb-12">

          {/* Header */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-1">Self Assessment</p>
            <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight flex items-center gap-3">
              <Star className="h-8 w-8 text-[--ag-accent]" />
              Skill Reviews
            </h1>
            <p className="text-sm text-[--ag-muted] mt-1">
              Rate yourself honestly on each skill · AMSCE calibrates it against your resume, interviews & learning activity
            </p>
          </div>

          {/* Rating guide */}
          <div className="flex flex-wrap gap-3">
            {[1,2,3,4,5].map(v => (
              <div key={v} className="flex items-center gap-2">
                <span className={cn(
                  "w-6 h-6 text-xs font-extrabold border flex items-center justify-center",
                  v === 1 ? "bg-[--ag-danger]/10   border-[--ag-danger]/40   text-[--ag-danger]" :
                  v === 2 ? "bg-orange-400/10       border-orange-400/40       text-orange-400" :
                  v === 3 ? "bg-[--ag-warning]/10  border-[--ag-warning]/40  text-[--ag-warning]" :
                  v === 4 ? "bg-[--ag-accent]/10   border-[--ag-accent]/40   text-[--ag-accent]" :
                            "bg-[--ag-success]/10  border-[--ag-success]/40  text-[--ag-success]"
                )}>{v}</span>
                <span className="text-xs text-[--ag-muted]">{RATING_LABELS[v].label}</span>
              </div>
            ))}
          </div>

          <div className="grid lg:grid-cols-[1fr_280px] gap-6">
            {/* Skills list */}
            <div className="space-y-4">
              {/* Path selector */}
              <div className="flex items-center gap-3 flex-wrap">
                <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] shrink-0">Career Path:</p>
                <div className="flex flex-wrap gap-2">
                  {(Object.keys(PATH_SKILLS) as CareerPathKey[]).map(key => {
                    const p = CAREER_PATHS[key];
                    return (
                      <button
                        key={key}
                        onClick={() => setSelectedPath(key)}
                        className={cn(
                          "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all",
                          selectedPath === key
                            ? "bg-[--ag-accent] border-[--ag-accent] text-white"
                            : "bg-[--ag-surface] border-[--ag-border] text-[--ag-muted] hover:text-[--ag-text] hover:border-[--ag-accent]/30",
                        )}
                      >
                        <span>{p.emoji}</span> {p.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Category blocks */}
              {loading ? (
                <div className="flex items-center justify-center gap-2 py-16 text-[--ag-muted]">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span className="text-sm font-['JetBrains_Mono']">Loading your rating history…</span>
                </div>
              ) : (
                areas.map(area => (
                  <CategoryBlock
                    key={area.category}
                    category={area.category}
                    skills={area.skills}
                    ratings={ratings}
                    savingSkill={saving}
                    onRate={rate}
                    confidence={confidence}
                    computing={computing}
                  />
                ))
              )}

              {!loading && totalRated > 0 && (
                <button
                  onClick={resetAll}
                  className="flex items-center gap-2 text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors"
                >
                  <RefreshCw className="h-3.5 w-3.5" /> Reset all ratings for {goalPath.label}
                </button>
              )}
            </div>

            {/* Summary panel */}
            <div className="space-y-4">

              {/* Overall score */}
              <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-5 text-center space-y-3">
                <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">{goalPath.emoji} {goalPath.label}</p>
                {totalRated === 0 ? (
                  <>
                    <div className="text-5xl font-['JetBrains_Mono'] font-extrabold text-[--ag-border]">—</div>
                    <p className="text-xs text-[--ag-muted]">Rate your first skill to start</p>
                  </>
                ) : (
                  <>
                    <div className={cn(
                      "text-6xl font-['JetBrains_Mono'] font-extrabold",
                      overallAvg >= 4 ? "text-[--ag-success]" : overallAvg >= 3 ? "text-[--ag-accent]" :
                      overallAvg >= 2 ? "text-[--ag-warning]" : "text-[--ag-danger]",
                    )}>
                      {overallAvg.toFixed(1)}
                    </div>
                    <div className="text-sm text-[--ag-muted]">/ 5.0 average</div>
                    <span className={cn(
                      "inline-block px-3 py-1 text-xs font-extrabold uppercase tracking-widest border",
                      overallAvg >= 4 ? "bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]" :
                      overallAvg >= 3 ? "bg-[--ag-accent]/10  border-[--ag-accent]/40  text-[--ag-accent]"  :
                      overallAvg >= 2 ? "bg-[--ag-warning]/10 border-[--ag-warning]/40 text-[--ag-warning]" :
                                        "bg-[--ag-danger]/10  border-[--ag-danger]/40  text-[--ag-danger]",
                    )}>
                      Grade {overallGrade}
                    </span>
                    <div className="w-full h-1.5 bg-[--ag-border] mt-2">
                      <div
                        className={cn("h-full transition-all duration-700",
                          overallAvg >= 4 ? "bg-[--ag-success]" : overallAvg >= 3 ? "bg-[--ag-accent]" :
                          overallAvg >= 2 ? "bg-[--ag-warning]" : "bg-[--ag-danger]"
                        )}
                        style={{ width: `${overallPct}%` }}
                      />
                    </div>
                  </>
                )}

                {/* Progress */}
                <div className="pt-3 border-t border-[--ag-border] space-y-1">
                  <div className="flex justify-between text-xs">
                    <span className="text-[--ag-muted]">Skills rated</span>
                    <span className="font-['JetBrains_Mono'] font-bold text-[--ag-text]">{totalRated}/{totalSkills}</span>
                  </div>
                  <div className="h-1 bg-[--ag-border]">
                    <div className="h-full bg-[--ag-accent]/40 transition-all" style={{ width: `${completionPct}%` }} />
                  </div>
                  <p className="text-xs text-[--ag-muted]">{completionPct}% assessment complete</p>
                </div>
              </div>

              {/* AMSCE — Verification Trigger */}
              <VerificationPrompts
                triggers={triggers}
                log={triggerLog}
                onAct={(skill, module) => {
                  if (!user) return;
                  markTriggerActed(user.id, selectedPath, skill, module);
                  setTriggerLog(prev => ({
                    ...prev,
                    [skill]: { skill, reason: "", actedAt: new Date().toISOString(), suggestedModule: module },
                  }));
                }}
              />

              {/* Strengths */}
              {strengths.length > 0 && (
                <div className="rounded-none bg-[--ag-surface] border border-[--ag-success]/30 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-success] mb-3 flex items-center gap-2">
                    <CheckCircle2 className="h-3.5 w-3.5" /> Your Strengths ({strengths.length})
                  </p>
                  <div className="space-y-1.5">
                    {strengths.map(s => (
                      <div key={s} className="flex items-center justify-between">
                        <span className="text-xs text-[--ag-text]">{s}</span>
                        <span className={cn(
                          "text-[10px] font-bold px-1.5 py-0.5 border",
                          ratings[s] === 5
                            ? "bg-[--ag-success]/10 border-[--ag-success]/30 text-[--ag-success]"
                            : "bg-[--ag-accent]/10  border-[--ag-accent]/30  text-[--ag-accent]",
                        )}>
                          {ratings[s] === 5 ? "Expert" : "Confident"}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Focus areas */}
              {focusAreas.length > 0 && (
                <div className="rounded-none bg-[--ag-surface] border border-[--ag-warning]/30 p-4">
                  <p className="text-xs font-extrabold uppercase tracking-wider text-[--ag-warning] mb-3 flex items-center gap-2">
                    <AlertCircle className="h-3.5 w-3.5" /> Focus On These
                  </p>
                  <div className="space-y-1.5">
                    {focusAreas.map(s => (
                      <div key={s} className="flex items-center justify-between">
                        <span className="text-xs text-[--ag-text]">{s}</span>
                        <span className="text-[10px] font-bold px-1.5 py-0.5 border bg-[--ag-warning]/10 border-[--ag-warning]/30 text-[--ag-warning]">
                          {ratings[s] === 1 ? "Start here" : "Needs work"}
                        </span>
                      </div>
                    ))}
                  </div>
                  <a
                    href="/events"
                    className="mt-4 flex items-center gap-1 text-xs font-bold text-[--ag-accent] hover:underline"
                  >
                    <TrendingUp className="h-3.5 w-3.5" /> Find learning resources →
                  </a>
                </div>
              )}

              {/* Category breakdown */}
              {totalRated > 0 && (
                <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-4">
                  <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mb-3">By Category</p>
                  <div className="space-y-3">
                    {areas.map(area => {
                      const scores = area.skills.map(s => ratings[s] ?? 0).filter(v => v > 0);
                      const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;
                      return (
                        <div key={area.category} className="space-y-1">
                          <div className="flex justify-between text-xs">
                            <span className="text-[--ag-muted]">{area.category}</span>
                            <span className="font-['JetBrains_Mono'] font-bold text-[--ag-text]">
                              {scores.length ? avg.toFixed(1) : "—"}
                            </span>
                          </div>
                          <div className="h-1 bg-[--ag-border]">
                            <div
                              className={cn("h-full transition-all duration-500",
                                avg >= 4 ? "bg-[--ag-success]" : avg >= 3 ? "bg-[--ag-accent]" :
                                avg >= 2 ? "bg-[--ag-warning]" : avg > 0 ? "bg-[--ag-danger]" : "bg-transparent"
                              )}
                              style={{ width: `${(avg / 5) * 100}%` }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
