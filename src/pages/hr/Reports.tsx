import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { calcFitScore, getFitLabel } from "@/lib/fitScore";
import { cn } from "@/lib/utils";
import {
  BarChart3, Users, CheckCircle2, Briefcase, ChevronDown,
  Trophy, ExternalLink, TrendingUp, Target,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  job: {
    id: string;
    title: string;
    required_skills: string[];
    career_domain: string | null;
  } | null;
  applicant: {
    id: string;
    full_name: string | null;
    email: string | null;
    headline: string | null;
    career_goal: string | null;
    skills: string[];
    experience: any[];
    projects: any[];
    certifications: any[];
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
    bio: string | null;
  } | null;
}

interface JobOption { id: string; title: string; required_skills: string[]; career_domain: string | null; }

// ─── Sub-components ───────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent }: {
  label: string; value: string | number; icon: React.ElementType; accent?: boolean;
}) {
  return (
    <div className={cn("bg-[--ag-surface] border p-5 space-y-3", accent ? "border-[--ag-accent]/40" : "border-[--ag-border]")}>
      <div className="flex items-center justify-between">
        <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">{label}</p>
        <Icon className={cn("h-4 w-4", accent ? "text-[--ag-accent]" : "text-[--ag-muted]")} />
      </div>
      <p className={cn("text-3xl font-['JetBrains_Mono'] font-extrabold", accent ? "text-[--ag-accent]" : "text-[--ag-text]")}>
        {value}
      </p>
    </div>
  );
}

function ScoreBar({ score }: { score: number }) {
  const { color } = getFitLabel(score);
  return (
    <div className="flex items-center gap-3 min-w-[140px]">
      <div className="flex-1 h-1.5 bg-[--ag-border]">
        <div
          className="h-full transition-all duration-700"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span
        className="font-['JetBrains_Mono'] font-extrabold text-sm w-8 text-right shrink-0"
        style={{ color }}
      >
        {score}
      </span>
    </div>
  );
}

function RankBadge({ rank }: { rank: number }) {
  const styles =
    rank === 1 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
    rank === 2 ? "bg-slate-500/20 border-slate-400/50 text-slate-300" :
    rank === 3 ? "bg-orange-800/20 border-orange-700/50 text-orange-400" :
    "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted]";

  return (
    <div className={cn("w-8 h-8 flex items-center justify-center font-['JetBrains_Mono'] font-extrabold text-sm border shrink-0", styles)}>
      {rank <= 3 ? ["🥇", "🥈", "🥉"][rank - 1] : `#${rank}`}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Reports() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedJob, setSelectedJob] = useState("all");
  const [statusFilter, setStatusFilter] = useState<"all" | "shortlisted" | "applied" | "reviewing">("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: apps }, { data: jobData }] = await Promise.all([
        (supabase as any)
          .from("applications")
          .select(`
            id, status, applied_at,
            job:job_postings!job_id(id, title, required_skills, career_domain),
            applicant:profiles!applicant_id(
              id, full_name, email, headline, career_goal, skills, bio,
              experience, projects, certifications,
              linkedin_url, github_url, portfolio_url
            )
          `)
          .order("applied_at", { ascending: false }),

        (supabase as any)
          .from("job_postings")
          .select("id, title, required_skills, career_domain")
          .eq("employer_id", user.id)
          .order("created_at", { ascending: false }),
      ]);

      if (apps) setApplications(apps);
      if (jobData) setJobs(jobData);
      setLoading(false);
    };
    load();
  }, [user]);

  // ─ Stats ─
  const stats = useMemo(() => ({
    total: applications.length,
    shortlisted: applications.filter(a => a.status === "shortlisted").length,
    hired: applications.filter(a => a.status === "hired").length,
    activeJobs: jobs.length,
  }), [applications, jobs]);

  // ─ Pipeline chart data ─
  const pipeline = useMemo(() => {
    const counts = { applied: 0, reviewing: 0, shortlisted: 0, hired: 0 };
    applications.forEach(a => {
      if (a.status in counts) counts[a.status as keyof typeof counts]++;
    });
    return counts;
  }, [applications]);

  const maxPipeline = Math.max(...Object.values(pipeline), 1);

  // ─ Scored candidates ─
  const ranked = useMemo(() => {
    const filtered = applications.filter(a => {
      const matchesJob = selectedJob === "all" || a.job?.id === selectedJob;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;
      return matchesJob && matchesStatus && !!a.applicant && !!a.job;
    });

    const jobForScoring = selectedJob !== "all"
      ? jobs.find(j => j.id === selectedJob) ?? null
      : null;

    return filtered
      .map(app => {
        const job = jobForScoring ?? app.job;
        const breakdown = app.applicant && job
          ? calcFitScore(
              {
                full_name: app.applicant.full_name,
                headline: app.applicant.headline,
                bio: app.applicant.bio,
                career_goal: app.applicant.career_goal,
                skills: app.applicant.skills ?? [],
                experience: app.applicant.experience ?? [],
                projects: app.applicant.projects ?? [],
                certifications: app.applicant.certifications ?? [],
                linkedin_url: app.applicant.linkedin_url,
                github_url: app.applicant.github_url,
                portfolio_url: app.applicant.portfolio_url,
              },
              { required_skills: job.required_skills ?? [], career_domain: job.career_domain }
            )
          : null;
        return { ...app, breakdown };
      })
      .sort((a, b) => (b.breakdown?.total ?? 0) - (a.breakdown?.total ?? 0));
  }, [applications, jobs, selectedJob, statusFilter]);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Header */}
        <div>
          <h1 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text] flex items-center gap-2">
            <BarChart3 className="h-6 w-6 text-[--ag-accent]" /> Reports & Rankings
          </h1>
          <p className="text-[--ag-muted] text-sm mt-0.5">
            Candidate fit scores, pipeline overview, and hiring insights
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Total Applications" value={loading ? "—" : stats.total} icon={Users} accent />
          <StatCard label="Shortlisted" value={loading ? "—" : stats.shortlisted} icon={CheckCircle2} />
          <StatCard label="Hired" value={loading ? "—" : stats.hired} icon={Trophy} />
          <StatCard label="Active Jobs" value={loading ? "—" : stats.activeJobs} icon={Briefcase} />
        </div>

        {/* Pipeline bar chart */}
        {!loading && (
          <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
            <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-[--ag-accent]" /> Hiring Pipeline
            </h2>
            <div className="flex items-end gap-4 h-28">
              {(Object.entries(pipeline) as [string, number][]).map(([stage, count]) => (
                <div key={stage} className="flex flex-col items-center gap-2 flex-1">
                  <span className="text-sm font-['JetBrains_Mono'] font-bold text-[--ag-accent]">{count}</span>
                  <div className="w-full bg-[--ag-bg] border border-[--ag-border] relative" style={{ height: "60px" }}>
                    <div
                      className="absolute bottom-0 left-0 right-0 bg-[--ag-accent] transition-all duration-700"
                      style={{ height: `${(count / maxPipeline) * 100}%` }}
                    />
                  </div>
                  <span className="text-[10px] text-[--ag-muted] font-bold uppercase tracking-wider capitalize">{stage}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Candidate Ranking Leaderboard */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-5">
            <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide flex items-center gap-2">
              <Trophy className="h-4 w-4 text-amber-400" /> Candidate Fit Score Ranking
            </h2>

            {/* Controls */}
            <div className="flex gap-2 flex-wrap">
              {/* Status filter */}
              <div className="relative">
                <select
                  value={statusFilter}
                  onChange={e => setStatusFilter(e.target.value as typeof statusFilter)}
                  className="h-8 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-7 text-xs text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none"
                >
                  <option value="all">All Statuses</option>
                  <option value="applied">Applied</option>
                  <option value="reviewing">Reviewing</option>
                  <option value="shortlisted">Shortlisted</option>
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--ag-muted] pointer-events-none" />
              </div>

              {/* Job filter */}
              <div className="relative">
                <select
                  value={selectedJob}
                  onChange={e => setSelectedJob(e.target.value)}
                  className="h-8 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-7 text-xs text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none min-w-[180px]"
                >
                  <option value="all">All Jobs</option>
                  {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
                </select>
                <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--ag-muted] pointer-events-none" />
              </div>
            </div>
          </div>

          {/* Score legend */}
          <div className="flex flex-wrap gap-x-4 gap-y-1 mb-4 text-[10px] text-[--ag-muted] font-bold">
            {[["80–100", "#10B981", "Excellent"], ["65–79", "#0E7490", "Strong"], ["50–64", "#3B82F6", "Good"], ["35–49", "#F59E0B", "Fair"], ["0–34", "#EF4444", "Weak"]].map(([range, color, label]) => (
              <span key={label} className="flex items-center gap-1.5">
                <span className="w-2.5 h-2.5 inline-block rounded-full" style={{ backgroundColor: color as string }} />
                {range} {label}
              </span>
            ))}
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map(i => <div key={i} className="h-16 bg-[--ag-bg] border border-[--ag-border] animate-pulse" />)}
            </div>
          ) : ranked.length === 0 ? (
            <div className="text-center py-16 border border-dashed border-[--ag-border]">
              <Target className="h-10 w-10 text-[--ag-border] mx-auto mb-3" />
              <p className="font-bold text-[--ag-muted]">No candidates to rank</p>
              <p className="text-xs text-[--ag-muted] mt-1">Post a job or adjust filters to see rankings.</p>
            </div>
          ) : (
            <>
              {/* Table header */}
              <div className="hidden sm:grid grid-cols-[32px_1fr_120px_160px_80px_32px] gap-3 px-3 py-2 text-[10px] font-bold uppercase tracking-widest text-[--ag-muted] border-b border-[--ag-border] mb-1">
                <span>#</span>
                <span>Candidate</span>
                <span>Applied For</span>
                <span>Fit Score</span>
                <span>Breakdown</span>
                <span />
              </div>

              <div className="space-y-1">
                {ranked.map((app, i) => {
                  const p = app.applicant;
                  const goalPath = p?.career_goal ? CAREER_PATHS[p.career_goal as CareerPathKey] : null;
                  const { label: fitLabel, color: fitColor } = getFitLabel(app.breakdown?.total ?? 0);

                  return (
                    <div
                      key={app.id}
                      className={cn(
                        "grid grid-cols-1 sm:grid-cols-[32px_1fr_120px_160px_80px_32px] gap-3 items-center px-3 py-3 border transition-all hover:border-[--ag-accent]/30",
                        i === 0 ? "border-amber-500/20 bg-amber-950/10" : "border-[--ag-border] bg-[--ag-bg]"
                      )}
                    >
                      {/* Rank */}
                      <RankBadge rank={i + 1} />

                      {/* Candidate */}
                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <div className="h-7 w-7 bg-[--ag-accent-dim] flex items-center justify-center shrink-0 text-[--ag-accent] font-bold text-xs">
                            {p?.full_name?.charAt(0).toUpperCase() ?? "?"}
                          </div>
                          <div className="min-w-0">
                            <p className="font-bold text-[--ag-text] text-sm truncate">{p?.full_name ?? "Unknown"}</p>
                            {goalPath && (
                              <p className="text-[10px] text-[--ag-muted] truncate">{goalPath.emoji} {goalPath.label}</p>
                            )}
                          </div>
                        </div>
                        {/* Status badge on mobile */}
                        <div className="sm:hidden mt-1">
                          <span className="text-[10px] font-bold capitalize text-[--ag-muted]">{app.status}</span>
                        </div>
                      </div>

                      {/* Job */}
                      <div className="min-w-0 hidden sm:block">
                        <p className="text-xs text-[--ag-muted] truncate">{app.job?.title ?? "—"}</p>
                        <span className={cn(
                          "text-[10px] font-bold capitalize",
                          app.status === "shortlisted" ? "text-emerald-400" :
                          app.status === "hired" ? "text-purple-400" :
                          app.status === "rejected" ? "text-red-400" : "text-[--ag-muted]"
                        )}>
                          {app.status}
                        </span>
                      </div>

                      {/* Score bar */}
                      <div className="hidden sm:block">
                        {app.breakdown
                          ? <ScoreBar score={app.breakdown.total} />
                          : <span className="text-xs text-[--ag-muted]">—</span>
                        }
                        <p className="text-[10px] mt-0.5" style={{ color: fitColor }}>{fitLabel}</p>
                      </div>

                      {/* Breakdown mini */}
                      <div className="hidden sm:block text-[10px] text-[--ag-muted] space-y-0.5 font-['JetBrains_Mono']">
                        {app.breakdown && (
                          <>
                            <div>Sk {app.breakdown.skillsScore}/40</div>
                            <div>Do {app.breakdown.domainScore}/20</div>
                            <div>Ex {app.breakdown.experienceScore}/20</div>
                          </>
                        )}
                      </div>

                      {/* View profile */}
                      <div className="flex justify-end">
                        {p?.id && (
                          <button
                            onClick={() => navigate(`/hr/candidates/${p.id}`)}
                            className="p-1.5 border border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent] hover:text-[--ag-accent] transition-all"
                            title="View Profile"
                          >
                            <ExternalLink className="h-3.5 w-3.5" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <p className="text-[10px] text-[--ag-muted] mt-3 text-right">
                Fit Score = Skills (40) + Domain (20) + Experience (20) + Portfolio (10) + Profile (10)
              </p>
            </>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
