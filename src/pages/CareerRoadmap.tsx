import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { CAREER_ROADMAPS } from "@/data/careerRoadmaps";
import { cn } from "@/lib/utils";
import { CheckCircle2, Circle, Lock, Zap, TrendingUp, Briefcase, Building2, ChevronRight, RotateCcw } from "lucide-react";

// ─── Helpers ──────────────────────────────────────────────────────────────────

function normSkill(s: string): string {
  return s.toLowerCase().replace(/[\s.\-_()/]/g, "").replace(/js$/, "");
}

function isLearnedSkill(
  skill: string,
  profileNorms: Set<string>,
  checkedNorms: Set<string>
): boolean {
  // Handle "X or Y" patterns in roadmap data
  const parts = skill.split(" or ").map((p) => p.trim());
  return parts.some((part) => {
    const n = normSkill(part);
    for (const p of profileNorms) {
      if (p === n || p.includes(n) || n.includes(p)) return true;
    }
    for (const p of checkedNorms) {
      if (p === n || p.includes(n) || n.includes(p)) return true;
    }
    return false;
  });
}

function getLevelLabel(pct: number): { title: string; sub: string; color: string } {
  if (pct < 15) return { title: "Novice", sub: "Just getting started", color: "#6B7280" };
  if (pct < 35) return { title: "Explorer", sub: "Building your base", color: "#F59E0B" };
  if (pct < 55) return { title: "Learner", sub: "Good momentum", color: "#3B82F6" };
  if (pct < 72) return { title: "Practitioner", sub: "Halfway there", color: "#8B5CF6" };
  if (pct < 88) return { title: "Advanced", sub: "Almost job-ready", color: "#10B981" };
  return { title: "Expert", sub: "You're job-ready!", color: "#0E7490" };
}

const DIFFICULTY_STYLES = {
  Beginner:     { bg: "bg-emerald-950/60", border: "border-emerald-500/40", badge: "bg-emerald-500/20 text-emerald-400 border-emerald-500/40", icon: "🌱" },
  Intermediate: { bg: "bg-amber-950/60",   border: "border-amber-500/40",   badge: "bg-amber-500/20 text-amber-400 border-amber-500/40",   icon: "⚡" },
  Advanced:     { bg: "bg-purple-950/60",  border: "border-purple-500/40",  badge: "bg-purple-500/20 text-purple-400 border-purple-500/40", icon: "🔥" },
};

const JOB_LEVEL_STYLES = {
  Entry:  { accent: "#10B981", label: "Entry Level",  ring: "border-emerald-500/50" },
  Mid:    { accent: "#0E7490", label: "Mid Level",    ring: "border-[--ag-accent]/50" },
  Senior: { accent: "#8B5CF6", label: "Senior Level", ring: "border-purple-500/50" },
};

// ─── SVG Readiness Ring ───────────────────────────────────────────────────────

function ReadinessRing({ pct, level }: { pct: number; level: ReturnType<typeof getLevelLabel> }) {
  const R = 56;
  const C = 2 * Math.PI * R;
  const dash = (pct / 100) * C;
  return (
    <div className="relative flex flex-col items-center">
      <svg width="152" height="152" viewBox="0 0 152 152">
        {/* Glow filter */}
        <defs>
          <filter id="glow">
            <feGaussianBlur stdDeviation="3" result="coloredBlur" />
            <feMerge><feMergeNode in="coloredBlur" /><feMergeNode in="SourceGraphic" /></feMerge>
          </filter>
        </defs>
        {/* Track */}
        <circle cx="76" cy="76" r={R} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="9" />
        {/* Progress arc */}
        <circle
          cx="76" cy="76" r={R}
          fill="none"
          stroke={level.color}
          strokeWidth="9"
          strokeDasharray={`${dash} ${C}`}
          strokeLinecap="round"
          transform="rotate(-90 76 76)"
          filter="url(#glow)"
          style={{ transition: "stroke-dasharray 1.2s cubic-bezier(0.4,0,0.2,1)" }}
        />
        {/* Center text */}
        <text x="76" y="70" textAnchor="middle" fill={level.color} fontSize="26" fontWeight="800" fontFamily="JetBrains Mono, monospace">
          {pct}
        </text>
        <text x="76" y="84" textAnchor="middle" fill={level.color} fontSize="9" fontFamily="JetBrains Mono, monospace" opacity="0.8">
          % READY
        </text>
      </svg>
      <div className="mt-1 text-center">
        <p className="font-['Syne'] font-extrabold text-sm" style={{ color: level.color }}>
          {level.title}
        </p>
        <p className="text-xs text-[--ag-muted]">{level.sub}</p>
      </div>
    </div>
  );
}

// ─── Phase Node Tracker ───────────────────────────────────────────────────────

function PhaseTracker({ phases, completions, activePhase }: {
  phases: { period: string; title: string }[];
  completions: number[];
  activePhase: number;
}) {
  return (
    <div className="flex items-center gap-0 relative">
      {phases.map((phase, i) => {
        const done = completions[i] >= 70;
        const active = i === activePhase;
        const locked = i > activePhase && !done;
        return (
          <div key={i} className="flex items-center">
            {/* Node */}
            <div className="flex flex-col items-center gap-1.5 relative">
              <div
                className={cn(
                  "w-10 h-10 rounded-full flex items-center justify-center border-2 transition-all relative",
                  done && "border-emerald-500 bg-emerald-500/20",
                  active && !done && "border-[--ag-accent] bg-[--ag-accent]/20",
                  locked && "border-[--ag-border] bg-[--ag-surface]"
                )}
                style={active && !done ? { boxShadow: "0 0 16px rgba(14,116,144,0.5)" } : undefined}
              >
                {active && !done && (
                  <span className="absolute inset-0 rounded-full border-2 border-[--ag-accent] animate-ping opacity-40" />
                )}
                {done ? (
                  <CheckCircle2 className="h-5 w-5 text-emerald-400" />
                ) : locked ? (
                  <Lock className="h-4 w-4 text-[--ag-muted]" />
                ) : (
                  <span className="text-sm font-['JetBrains_Mono'] font-bold text-[--ag-accent]">
                    {i + 1}
                  </span>
                )}
              </div>
              <div className="text-center">
                <p className={cn(
                  "text-[10px] font-bold uppercase tracking-wider",
                  done && "text-emerald-400",
                  active && !done && "text-[--ag-accent]",
                  locked && "text-[--ag-muted]"
                )}>
                  {done ? "Done" : active ? "← Here" : "Locked"}
                </p>
                <p className="text-[10px] text-[--ag-muted] mt-0.5 max-w-[80px] text-center leading-tight hidden sm:block">
                  {phase.period}
                </p>
              </div>
            </div>

            {/* Connector */}
            {i < phases.length - 1 && (
              <div className="relative w-16 sm:w-24 h-0.5 mx-1 -mt-8">
                <div className="absolute inset-0 bg-[--ag-border]" />
                {completions[i] >= 70 && (
                  <div
                    className="absolute inset-0 bg-emerald-500"
                    style={{ boxShadow: "0 0 8px rgba(16,185,129,0.6)" }}
                  />
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

// ─── Phase Card ───────────────────────────────────────────────────────────────

function PhaseCard({
  phase, index, completion, isActive, isLocked, skills, onToggle,
}: {
  phase: { period: string; title: string; focus: string; skills: string[]; milestone: string };
  index: number;
  completion: number;
  isActive: boolean;
  isLocked: boolean;
  skills: Array<{ name: string; learned: boolean; fromProfile: boolean }>;
  onToggle: (skill: string) => void;
}) {
  const borderColor = isLocked
    ? "border-[--ag-border]"
    : completion >= 70
    ? "border-emerald-500/30"
    : isActive
    ? "border-[--ag-accent]/40"
    : "border-[--ag-border]";

  const glowStyle = isActive
    ? { boxShadow: "0 0 30px rgba(14,116,144,0.12), inset 0 1px 0 rgba(14,116,144,0.08)" }
    : completion >= 70
    ? { boxShadow: "0 0 20px rgba(16,185,129,0.08)" }
    : undefined;

  return (
    <div
      className={cn("relative bg-[--ag-surface] border p-5 transition-all", borderColor)}
      style={glowStyle}
    >
      {/* Phase number accent */}
      <div className={cn(
        "absolute top-0 left-0 w-1 h-full",
        isLocked ? "bg-[--ag-border]" : completion >= 70 ? "bg-emerald-500" : "bg-[--ag-accent]"
      )} />

      <div className="pl-3">
        {/* Header */}
        <div className="flex items-start justify-between mb-3">
          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className={cn(
                "text-xs font-bold uppercase tracking-widest font-['JetBrains_Mono']",
                isLocked ? "text-[--ag-muted]" : completion >= 70 ? "text-emerald-400" : "text-[--ag-accent]"
              )}>
                Phase {index + 1}
              </span>
              <span className="text-xs text-[--ag-muted]">·</span>
              <span className="text-xs text-[--ag-muted]">{phase.period}</span>
              {isActive && (
                <span className="text-[10px] font-bold px-1.5 py-0.5 bg-[--ag-accent]/20 text-[--ag-accent] border border-[--ag-accent]/30">
                  YOU ARE HERE
                </span>
              )}
            </div>
            <h3 className={cn(
              "font-['Syne'] font-bold text-base",
              isLocked ? "text-[--ag-muted]" : "text-[--ag-text]"
            )}>
              {phase.title}
            </h3>
            <p className="text-xs text-[--ag-muted] mt-0.5">{phase.focus}</p>
          </div>

          {/* Phase completion bar */}
          <div className="text-right shrink-0">
            <p className={cn(
              "text-lg font-['JetBrains_Mono'] font-bold",
              isLocked ? "text-[--ag-muted]" : completion >= 70 ? "text-emerald-400" : "text-[--ag-accent]"
            )}>
              {Math.round(completion)}%
            </p>
            <div className="w-16 h-1 bg-[--ag-border] mt-1">
              <div
                className={cn("h-full transition-all duration-700", completion >= 70 ? "bg-emerald-500" : "bg-[--ag-accent]")}
                style={{ width: `${completion}%` }}
              />
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="flex flex-wrap gap-2 mb-4">
          {skills.map(({ name, learned, fromProfile }) => (
            <button
              key={name}
              onClick={() => !fromProfile && onToggle(name)}
              title={fromProfile ? "From your profile" : learned ? "Click to unmark" : "Click to mark as learned"}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium border transition-all",
                fromProfile
                  ? "bg-emerald-950/60 border-emerald-500/50 text-emerald-300 cursor-default"
                  : learned
                  ? "bg-[--ag-accent]/20 border-[--ag-accent]/50 text-[--ag-accent] cursor-pointer hover:bg-[--ag-accent]/30"
                  : isLocked
                  ? "bg-transparent border-[--ag-border] text-[--ag-muted] cursor-not-allowed"
                  : "bg-transparent border-[--ag-border] text-[--ag-muted] cursor-pointer hover:border-[--ag-accent]/40 hover:text-[--ag-text]"
              )}
              style={learned && !fromProfile ? { boxShadow: "0 0 8px rgba(14,116,144,0.25)" } : undefined}
            >
              {(learned || fromProfile) && (
                <CheckCircle2 className={cn("h-3 w-3 shrink-0", fromProfile ? "text-emerald-400" : "text-[--ag-accent]")} />
              )}
              {!learned && !fromProfile && <Circle className="h-3 w-3 shrink-0 opacity-40" />}
              {name}
              {fromProfile && <span className="text-[9px] opacity-60 ml-0.5">profile</span>}
            </button>
          ))}
        </div>

        {/* Milestone */}
        <div className={cn(
          "flex items-start gap-2 px-3 py-2 border text-xs",
          isLocked
            ? "border-[--ag-border] bg-[--ag-bg]"
            : completion >= 70
            ? "border-emerald-500/20 bg-emerald-950/30"
            : "border-[--ag-accent]/20 bg-[--ag-accent-dim]"
        )}>
          <span className="shrink-0 mt-0.5">🎯</span>
          <p className={cn(isLocked ? "text-[--ag-muted]" : "text-[--ag-text]")}>
            <span className="font-bold">Milestone: </span>
            {phase.milestone}
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Project Card ─────────────────────────────────────────────────────────────

function ProjectCard({ project }: { project: {
  title: string; description: string; techStack: string[]; difficulty: "Beginner" | "Intermediate" | "Advanced"; outcome: string;
}}) {
  const s = DIFFICULTY_STYLES[project.difficulty];
  return (
    <div className={cn("border p-4 space-y-3 transition-all hover:brightness-110", s.bg, s.border)}>
      <div className="flex items-start justify-between gap-2">
        <h4 className="font-['Syne'] font-bold text-[--ag-text] text-sm leading-tight">{project.title}</h4>
        <span className={cn("shrink-0 text-[10px] font-bold px-2 py-0.5 border flex items-center gap-1", s.badge)}>
          {s.icon} {project.difficulty}
        </span>
      </div>
      <p className="text-xs text-[--ag-muted] leading-relaxed">{project.description}</p>
      <div className="flex flex-wrap gap-1.5">
        {project.techStack.map((t) => (
          <span key={t} className="text-[10px] px-2 py-0.5 bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted] font-['JetBrains_Mono']">
            {t}
          </span>
        ))}
      </div>
      <div className="pt-2 border-t border-white/5 flex items-center gap-2">
        <TrendingUp className="h-3.5 w-3.5 text-[--ag-accent] shrink-0" />
        <p className="text-[11px] text-[--ag-muted] italic">{project.outcome}</p>
      </div>
    </div>
  );
}

// ─── Job Level Card ───────────────────────────────────────────────────────────

function JobLevelCard({ level }: { level: { level: "Entry" | "Mid" | "Senior"; titles: string[]; salary: string; experience: string; keySkills: string[] } }) {
  const s = JOB_LEVEL_STYLES[level.level];
  return (
    <div className={cn("bg-[--ag-surface] border p-5 flex-1 min-w-0 space-y-3", s.ring)}>
      <div>
        <span className="text-[10px] font-bold uppercase tracking-widest" style={{ color: s.accent }}>{s.label}</span>
        <p className="font-['Syne'] font-bold text-[--ag-text] text-sm mt-1 leading-tight">
          {level.titles[0]}
        </p>
        {level.titles[1] && (
          <p className="text-xs text-[--ag-muted] mt-0.5">also: {level.titles.slice(1).join(", ")}</p>
        )}
      </div>

      <div className="flex items-center justify-between gap-2">
        <div>
          <p className="text-[10px] text-[--ag-muted] font-bold uppercase tracking-wider">Salary</p>
          <p className="font-['JetBrains_Mono'] font-bold text-sm" style={{ color: s.accent }}>{level.salary}</p>
        </div>
        <div className="text-right">
          <p className="text-[10px] text-[--ag-muted] font-bold uppercase tracking-wider">Experience</p>
          <p className="text-xs text-[--ag-text] font-bold">{level.experience}</p>
        </div>
      </div>

      <div className="flex flex-wrap gap-1.5 pt-2 border-t border-[--ag-border]">
        {level.keySkills.map((sk) => (
          <span key={sk} className="text-[10px] px-2 py-0.5 bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted]">
            {sk}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── No Career Goal State ─────────────────────────────────────────────────────

function NoCareerGoal() {
  const navigate = useNavigate();
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] text-center px-4">
      <div className="text-6xl mb-6">🗺️</div>
      <h2 className="font-['Syne'] font-extrabold text-2xl text-[--ag-text] mb-3">
        Your roadmap is waiting
      </h2>
      <p className="text-[--ag-muted] max-w-sm text-sm leading-relaxed mb-6">
        Set your career goal first and we'll generate a personalized 6-month roadmap — with phases, projects, and salary targets.
      </p>
      <button
        onClick={() => navigate("/onboarding/jobseeker")}
        className="flex items-center gap-2 px-6 py-3 bg-[--ag-accent] text-white font-bold text-sm hover:brightness-110 transition-all"
      >
        Take the Career Quiz <ChevronRight className="h-4 w-4" />
      </button>
    </div>
  );
}

// ─── Main Page ────────────────────────────────────────────────────────────────

export default function CareerRoadmap() {
  const { profile } = useAuth();
  const navigate = useNavigate();
  const pathKey = profile?.career_goal as CareerPathKey | null | undefined;
  const roadmap = pathKey ? CAREER_ROADMAPS[pathKey] : null;
  const careerPath = pathKey ? CAREER_PATHS[pathKey] : null;

  // ─ Skill sets ─
  const profileSkillNorms = useMemo<Set<string>>(() => {
    const skills: string[] = (profile as any)?.skills ?? [];
    return new Set(skills.map(normSkill));
  }, [profile]);

  // ─ Manually checked skills (localStorage) ─
  const storageKey = `skillmatch_roadmap_${profile?.id ?? "guest"}_${pathKey ?? "none"}`;

  const [checked, setChecked] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(storageKey);
      return raw ? new Set(JSON.parse(raw)) : new Set<string>();
    } catch {
      return new Set<string>();
    }
  });

  const checkedNorms = useMemo(
    () => new Set([...checked].map(normSkill)),
    [checked]
  );

  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify([...checked]));
    } catch {}
  }, [checked, storageKey]);

  function toggleSkill(skill: string) {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(skill)) next.delete(skill);
      else next.add(skill);
      return next;
    });
  }

  function resetProgress() {
    setChecked(new Set());
  }

  // ─ Computed data ─
  const phaseData = useMemo(() => {
    if (!roadmap) return [];
    return roadmap.phases.map((phase) => ({
      ...phase,
      skills: phase.skills.map((name) => {
        const fromProfile = isLearnedSkill(name, profileSkillNorms, new Set());
        const learned = fromProfile || isLearnedSkill(name, new Set(), checkedNorms);
        return { name, learned, fromProfile };
      }),
    }));
  }, [roadmap, profileSkillNorms, checkedNorms]);

  const phaseCompletions = useMemo(
    () => phaseData.map((p) => p.skills.length === 0 ? 0 : (p.skills.filter((s) => s.learned).length / p.skills.length) * 100),
    [phaseData]
  );

  const activePhase = useMemo(() => {
    const first = phaseCompletions.findIndex((c) => c < 70);
    return first === -1 ? phaseCompletions.length - 1 : first;
  }, [phaseCompletions]);

  const allSkills = useMemo(() => {
    if (!roadmap) return [];
    const seen = new Set<string>();
    const out: string[] = [];
    roadmap.phases.forEach((p) => p.skills.forEach((s) => { if (!seen.has(s)) { seen.add(s); out.push(s); } }));
    return out;
  }, [roadmap]);

  const readinessPct = useMemo(() => {
    if (allSkills.length === 0) return 0;
    const learned = allSkills.filter((s) => isLearnedSkill(s, profileSkillNorms, checkedNorms)).length;
    return Math.round((learned / allSkills.length) * 100);
  }, [allSkills, profileSkillNorms, checkedNorms]);

  const level = getLevelLabel(readinessPct);
  const checkedCount = [...checked].length;

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="max-w-5xl mx-auto pb-16">

          {!pathKey || !roadmap || !careerPath ? (
            <NoCareerGoal />
          ) : (
            <>
              {/* ── HERO BANNER ─────────────────────────────────────────── */}
              <div
                className="relative overflow-hidden border-b border-[--ag-border]"
                style={{
                  background: "linear-gradient(135deg, rgba(14,116,144,0.12) 0%, rgba(0,0,0,0) 60%), var(--ag-surface)",
                }}
              >
                {/* Background grid pattern */}
                <div
                  className="absolute inset-0 opacity-[0.03]"
                  style={{
                    backgroundImage: "linear-gradient(var(--ag-border) 1px, transparent 1px), linear-gradient(90deg, var(--ag-border) 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                {/* Glow orb */}
                <div
                  className="absolute -top-20 -right-20 w-64 h-64 rounded-full opacity-10 blur-3xl"
                  style={{ background: "radial-gradient(circle, #0E7490, transparent 70%)" }}
                />

                <div className="relative p-6 pb-0">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-6 mb-6">
                    {/* Career Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] font-['JetBrains_Mono']">
                          Career Roadmap
                        </span>
                        <span className="text-[--ag-muted]">·</span>
                        <span className="text-xs font-bold uppercase tracking-widest" style={{ color: careerPath.demandLevel === "Explosive" ? "#10B981" : "#0E7490" }}>
                          {careerPath.demandLevel} Demand
                        </span>
                      </div>
                      <h1 className="font-['Syne'] font-extrabold text-3xl sm:text-4xl text-[--ag-text] tracking-tight flex items-center gap-3 mb-3">
                        <span className="text-4xl">{careerPath.emoji}</span>
                        {careerPath.label}
                      </h1>
                      <p className="text-[--ag-muted] text-sm leading-relaxed max-w-md">{roadmap.summary}</p>

                      <div className="flex flex-wrap items-center gap-3 mt-4">
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-[--ag-accent]/15 border border-[--ag-accent]/30 text-[--ag-accent]">
                          <Briefcase className="h-3 w-3" /> {careerPath.salaryRange}
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-[--ag-surface] border border-[--ag-border] text-[--ag-muted]">
                          ⏱ 6-month roadmap
                        </span>
                        <span className="flex items-center gap-1.5 text-xs font-bold px-2.5 py-1 bg-[--ag-surface] border border-[--ag-border] text-[--ag-muted]">
                          🎯 {allSkills.length} skills tracked
                        </span>
                        {checkedCount > 0 && (
                          <button
                            onClick={resetProgress}
                            className="flex items-center gap-1.5 text-xs text-[--ag-muted] hover:text-[--ag-danger] transition-colors"
                            title="Reset manual progress"
                          >
                            <RotateCcw className="h-3 w-3" /> Reset progress
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Readiness Ring */}
                    <ReadinessRing pct={readinessPct} level={level} />
                  </div>

                  {/* Phase node tracker */}
                  <div className="flex items-end pb-6">
                    <PhaseTracker
                      phases={roadmap.phases}
                      completions={phaseCompletions}
                      activePhase={activePhase}
                    />
                  </div>
                </div>
              </div>

              <div className="p-6 space-y-10">

                {/* ── PHASE TIMELINE ───────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-['Syne'] font-extrabold text-lg text-[--ag-text] uppercase tracking-wide">
                      Skill Roadmap
                    </h2>
                    <div className="flex-1 h-px bg-[--ag-border]" />
                    <span className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">
                      {phaseData.reduce((a, p) => a + p.skills.filter((s) => s.learned).length, 0)} / {allSkills.length} skills
                    </span>
                  </div>

                  {/* Skill legend */}
                  <div className="flex flex-wrap items-center gap-4 mb-4 text-xs text-[--ag-muted]">
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-emerald-500/20 border border-emerald-500/50 inline-block" />
                      From your profile
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-[--ag-accent]/20 border border-[--ag-accent]/50 inline-block" />
                      Manually marked
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="w-3 h-3 bg-transparent border border-[--ag-border] inline-block" />
                      Still to learn
                    </span>
                  </div>

                  <div className="space-y-4">
                    {phaseData.map((phase, i) => (
                      <PhaseCard
                        key={i}
                        phase={phase}
                        index={i}
                        completion={phaseCompletions[i]}
                        isActive={i === activePhase}
                        isLocked={i > activePhase && phaseCompletions[i] === 0}
                        skills={phase.skills}
                        onToggle={toggleSkill}
                      />
                    ))}
                  </div>
                </section>

                {/* ── PROJECT IDEAS ─────────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-['Syne'] font-extrabold text-lg text-[--ag-text] uppercase tracking-wide">
                      Portfolio Projects
                    </h2>
                    <div className="flex-1 h-px bg-[--ag-border]" />
                    <span className="text-xs text-[--ag-muted]">{roadmap.projects.length} project ideas</span>
                  </div>
                  <p className="text-xs text-[--ag-muted] mb-4">
                    Build these to prove your skills to employers. Start with Beginner — ship at least 2 before applying.
                  </p>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {roadmap.projects.map((proj) => (
                      <ProjectCard key={proj.title} project={proj} />
                    ))}
                  </div>
                </section>

                {/* ── JOB PROGRESSION ──────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-['Syne'] font-extrabold text-lg text-[--ag-text] uppercase tracking-wide">
                      Job Progression
                    </h2>
                    <div className="flex-1 h-px bg-[--ag-border]" />
                  </div>
                  <p className="text-xs text-[--ag-muted] mb-4">
                    Where this path takes you — title, experience, and salary ranges in India.
                  </p>
                  <div className="flex flex-col sm:flex-row gap-4">
                    {roadmap.jobLevels.map((lvl, i) => (
                      <div key={lvl.level} className="flex items-stretch gap-4 flex-1 min-w-0">
                        <JobLevelCard level={lvl} />
                        {i < roadmap.jobLevels.length - 1 && (
                          <div className="hidden sm:flex items-center text-[--ag-muted]">
                            <ChevronRight className="h-5 w-5" />
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </section>

                {/* ── TOP COMPANIES ─────────────────────────────────────────── */}
                <section>
                  <div className="flex items-center gap-3 mb-5">
                    <h2 className="font-['Syne'] font-extrabold text-lg text-[--ag-text] uppercase tracking-wide">
                      Top Companies Hiring
                    </h2>
                    <div className="flex-1 h-px bg-[--ag-border]" />
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {roadmap.topCompanies.map((company) => (
                      <span
                        key={company}
                        className="flex items-center gap-2 px-3 py-1.5 bg-[--ag-surface] border border-[--ag-border] text-xs font-bold text-[--ag-text] hover:border-[--ag-accent]/40 transition-colors"
                      >
                        <Building2 className="h-3 w-3 text-[--ag-muted]" />
                        {company}
                      </span>
                    ))}
                  </div>
                </section>

                {/* ── CTA ───────────────────────────────────────────────────── */}
                <div
                  className="border border-[--ag-accent]/30 p-6 flex flex-col sm:flex-row items-center justify-between gap-4"
                  style={{ background: "linear-gradient(135deg, rgba(14,116,144,0.08), transparent)" }}
                >
                  <div>
                    <p className="font-['Syne'] font-bold text-[--ag-text]">
                      {readinessPct >= 60
                        ? "You're ready to start applying!"
                        : "Keep building your skills — then apply"}
                    </p>
                    <p className="text-xs text-[--ag-muted] mt-1">
                      {readinessPct >= 60
                        ? `At ${readinessPct}% readiness, you match the profile for entry-level roles. Start applying now.`
                        : `At ${readinessPct}% readiness, focus on Phase ${activePhase + 1} first. Jobs are waiting when you're ready.`}
                    </p>
                  </div>
                  <div className="flex gap-3 shrink-0">
                    <button
                      onClick={() => navigate("/ats-check")}
                      className="px-4 py-2 border border-[--ag-accent] text-[--ag-accent] text-xs font-bold hover:bg-[--ag-accent-dim] transition-all"
                    >
                      Check ATS Match
                    </button>
                    <button
                      onClick={() => navigate("/careers")}
                      className="flex items-center gap-2 px-4 py-2 bg-[--ag-accent] text-white text-xs font-bold hover:brightness-110 transition-all"
                    >
                      Browse Jobs <Zap className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            </>
          )}
        </main>
      </div>
    </div>
  );
}
