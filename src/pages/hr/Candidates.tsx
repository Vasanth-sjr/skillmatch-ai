import { useEffect, useMemo, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { calcFitScore, getFitLabel } from "@/lib/fitScore";
import { Input } from "@/components/ui/input";
import { Users, Search, ChevronDown, ExternalLink, ArrowUpDown, ShieldCheck } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  loadCandidateEvidenceSummaries, CandidateEvidenceSummary,
} from "@/lib/amsce/candidateEvidence";

// ─── Types ────────────────────────────────────────────────────────────────────

interface Applicant {
  id: string;
  status: string;
  applied_at: string;
  cover_note: string | null;
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
    skills: string[];
    career_goal: string | null;
    headline: string | null;
    bio: string | null;
    experience: any[];
    projects: any[];
    certifications: any[];
    linkedin_url: string | null;
    github_url: string | null;
    portfolio_url: string | null;
  } | null;
}

interface JobOption { id: string; title: string; }

const STATUSES = ["applied", "reviewing", "shortlisted", "rejected", "hired"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<Status, string> = {
  applied:     "bg-[--ag-accent]/10 text-[--ag-accent] border-[--ag-accent]/30",
  reviewing:   "bg-yellow-950/60 text-yellow-400 border-yellow-500/30",
  shortlisted: "bg-emerald-950/60 text-emerald-400 border-emerald-500/30",
  rejected:    "bg-red-950/60 text-red-400 border-red-500/30",
  hired:       "bg-purple-950/60 text-purple-400 border-purple-500/30",
};

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  return `${days}d ago`;
}

// ─── Fit Score Badge ──────────────────────────────────────────────────────────

function FitScoreBadge({ score, breakdown }: { score: number; breakdown: ReturnType<typeof calcFitScore> }) {
  const { label, color } = getFitLabel(score);
  return (
    <div className="flex flex-col items-center gap-1 min-w-[72px]">
      <div
        className="w-14 h-14 rounded-full flex items-center justify-center border-2 font-['JetBrains_Mono'] font-extrabold text-lg"
        style={{ borderColor: color, color, boxShadow: `0 0 12px ${color}30` }}
      >
        {score}
      </div>
      <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color }}>
        {label}
      </span>
      <div className="text-[9px] text-[--ag-muted] text-center leading-tight">
        {breakdown.matchedSkills.length}/{breakdown.matchedSkills.length + breakdown.missingSkills.length} skills
      </div>
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Candidates() {
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [jobs, setJobs] = useState<JobOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [jobFilter, setJobFilter] = useState(searchParams.get("job") ?? "all");
  const [statusFilter, setStatusFilter] = useState<Status | "all">("all");
  const [updating, setUpdating] = useState<string | null>(null);
  const [sortByScore, setSortByScore] = useState(false);
  // Evidence filtering: the point of the whole evidence layer is to let a
  // recruiter skip profiles rather than open all of them, so this belongs
  // on the list, not one level in.
  const [evidenceFilter, setEvidenceFilter] = useState<"all" | "any" | "verified">("all");

  const fetchData = async () => {
    if (!user) return;
    setLoading(true);

    const [{ data: appData }, { data: jobData }] = await Promise.all([
      (supabase as any)
        .from("applications")
        .select(`
          id, status, applied_at, cover_note,
          job:job_postings!job_id(id, title, required_skills, career_domain),
          applicant:profiles!applicant_id(
            id, full_name, email, skills, career_goal, headline, bio,
            experience, projects, certifications,
            linkedin_url, github_url, portfolio_url
          )
        `)
        .order("applied_at", { ascending: false }),

      (supabase as any)
        .from("job_postings")
        .select("id, title")
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false }),
    ]);

    if (appData) setApplicants(appData);
    if (jobData) setJobs(jobData);
    setLoading(false);
  };

  const [evidenceSummaries, setEvidenceSummaries] = useState<Record<string, CandidateEvidenceSummary>>({});

  useEffect(() => { fetchData(); }, [user]);

  // Batched after the applicant list arrives — one query pair for every
  // candidate on screen rather than one per row.
  useEffect(() => {
    const ids = applicants.map((a: any) => a.applicant?.id).filter(Boolean);
    if (ids.length === 0) return;
    loadCandidateEvidenceSummaries(ids).then(setEvidenceSummaries);
  }, [applicants]);

  // Auto-enable sort by score when a specific job is selected
  useEffect(() => {
    if (jobFilter !== "all") setSortByScore(true);
    else setSortByScore(false);
  }, [jobFilter]);

  const updateStatus = async (appId: string, newStatus: Status) => {
    setUpdating(appId);
    const { error } = await (supabase as any)
      .from("applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setApplicants(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast({ title: `Status updated → ${newStatus}` });
    }
    setUpdating(null);
  };

  // Compute fit scores for all applicants
  const scored = useMemo(() => {
    return applicants.map((app) => {
      const breakdown = app.applicant && app.job
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
            {
              required_skills: app.job.required_skills ?? [],
              career_domain: app.job.career_domain,
            }
          )
        : null;
      return { ...app, breakdown };
    });
  }, [applicants]);

  const filtered = useMemo(() => {
    let list = scored.filter((a) => {
      const name = a.applicant?.full_name?.toLowerCase() ?? "";
      const email = a.applicant?.email?.toLowerCase() ?? "";
      const job = a.job?.title?.toLowerCase() ?? "";
      const q = search.toLowerCase();
      const matchesSearch = !q || name.includes(q) || email.includes(q) || job.includes(q);
      const matchesJob = jobFilter === "all" || a.job?.id === jobFilter;
      const matchesStatus = statusFilter === "all" || a.status === statusFilter;

      const ev = a.applicant?.id ? evidenceSummaries[a.applicant.id] : undefined;
      const matchesEvidence =
        evidenceFilter === "all" ||
        (evidenceFilter === "any" && (ev?.corroboratedSkills ?? 0) > 0) ||
        (evidenceFilter === "verified" && (ev?.verifiedCertificates ?? 0) > 0);

      return matchesSearch && matchesJob && matchesStatus && matchesEvidence;
    });

    if (sortByScore) {
      list = [...list].sort((a, b) => (b.breakdown?.total ?? 0) - (a.breakdown?.total ?? 0));
    }
    return list;
  }, [scored, search, jobFilter, statusFilter, sortByScore, evidenceFilter, evidenceSummaries]);

  const counts: Record<string, number> = { all: applicants.length };
  STATUSES.forEach(s => { counts[s] = applicants.filter(a => a.status === s).length; });

  const selectedJobTitle = jobs.find(j => j.id === jobFilter)?.title;

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between flex-wrap gap-3">
          <div>
            <h1 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text] flex items-center gap-2">
              <Users className="h-6 w-6 text-[--ag-accent]" /> Candidates
            </h1>
            <p className="text-[--ag-muted] text-sm mt-0.5">
              {selectedJobTitle
                ? <>Viewing applicants for <span className="text-[--ag-accent] font-bold">{selectedJobTitle}</span> · sorted by fit score</>
                : "Review and manage all applicants"}
            </p>
          </div>

          {/* Sort toggle */}
          <button
            onClick={() => setSortByScore(v => !v)}
            className={cn(
              "flex items-center gap-2 px-3 py-2 border text-xs font-bold transition-all",
              sortByScore
                ? "border-[--ag-accent] bg-[--ag-accent] text-white"
                : "border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/50"
            )}
          >
            <ArrowUpDown className="h-3.5 w-3.5" />
            Sort by Fit Score
          </button>
        </div>

        {/* Evidence filter — lets a recruiter narrow to candidates whose
            claims are independently backed, which is the screening step
            this platform exists to make possible. */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">Evidence:</span>
          {([
            ["all", "All candidates"],
            ["any", "Has corroborated skills"],
            ["verified", "Has verified certificate"],
          ] as const).map(([key, label]) => (
            <button
              key={key}
              onClick={() => setEvidenceFilter(key)}
              className={cn(
                "flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold border transition-all",
                evidenceFilter === key
                  ? "bg-[--ag-success] border-[--ag-success] text-white"
                  : "bg-[--ag-surface] border-[--ag-border] text-[--ag-muted] hover:border-[--ag-success]/40",
              )}
            >
              {key !== "all" && <ShieldCheck className="h-3 w-3" />}
              {label}
            </button>
          ))}
          {evidenceFilter !== "all" && (
            <span className="text-[11px] text-[--ag-muted]">
              Candidates without evidence may simply not have used the platform yet.
            </span>
          )}
        </div>

        {/* Filters */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-4 space-y-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted]" />
              <Input
                placeholder="Search by name, email, job…"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 rounded-none border-[--ag-border] bg-[--ag-bg] focus:border-[--ag-accent]"
              />
            </div>
            <div className="relative">
              <select
                value={jobFilter}
                onChange={e => setJobFilter(e.target.value)}
                className="h-10 rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 pr-8 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none min-w-[200px]"
              >
                <option value="all">All Jobs</option>
                {jobs.map(j => <option key={j.id} value={j.id}>{j.title}</option>)}
              </select>
              <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted] pointer-events-none" />
            </div>
          </div>

          <div className="flex flex-wrap gap-2">
            {(["all", ...STATUSES] as const).map(s => (
              <button
                key={s}
                onClick={() => setStatusFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold border transition-all",
                  statusFilter === s
                    ? "border-[--ag-accent] bg-[--ag-accent] text-white"
                    : "border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/50"
                )}
              >
                {s.charAt(0).toUpperCase() + s.slice(1)}
                <span className="ml-1.5 opacity-70">({counts[s] ?? 0})</span>
              </button>
            ))}
          </div>
        </div>

        {/* Results */}
        {loading ? (
          <div className="space-y-3">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-28 bg-[--ag-surface] border border-[--ag-border] animate-pulse" />
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="text-center py-20 border border-dashed border-[--ag-border]">
            <Users className="h-10 w-10 text-[--ag-border] mx-auto mb-3" />
            <p className="font-bold text-[--ag-muted]">No candidates found</p>
            <p className="text-xs text-[--ag-muted] mt-1">Post a job to start receiving applications.</p>
          </div>
        ) : (
          <div className="space-y-3">
            <p className="text-xs text-[--ag-muted] font-semibold">
              {filtered.length} result{filtered.length !== 1 ? "s" : ""}
              {sortByScore && <span className="ml-2 text-[--ag-accent]">· ranked by fit score</span>}
            </p>

            {filtered.map((app, rank) => {
              const p = app.applicant;
              const goalPath = p?.career_goal ? CAREER_PATHS[p.career_goal as CareerPathKey] : null;
              const isUpdating = updating === app.id;
              const showScore = !!app.breakdown;

              return (
                <div
                  key={app.id}
                  className={cn(
                    "bg-[--ag-surface] border p-5 hover:border-[--ag-accent]/40 transition-all",
                    rank === 0 && sortByScore ? "border-emerald-500/40" : "border-[--ag-border]"
                  )}
                >
                  <div className="flex items-start gap-4">

                    {/* Rank badge (only when sorted by score) */}
                    {sortByScore && (
                      <div className={cn(
                        "shrink-0 w-8 h-8 flex items-center justify-center font-['JetBrains_Mono'] font-extrabold text-sm border",
                        rank === 0 ? "bg-amber-500/20 border-amber-500/50 text-amber-400" :
                        rank === 1 ? "bg-slate-500/20 border-slate-400/50 text-slate-300" :
                        rank === 2 ? "bg-orange-800/20 border-orange-700/50 text-orange-400" :
                        "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted]"
                      )}>
                        #{rank + 1}
                      </div>
                    )}

                    {/* Candidate info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1 flex-wrap">
                        <div className="h-9 w-9 bg-[--ag-accent-dim] flex items-center justify-center shrink-0 font-bold text-[--ag-accent] text-sm">
                          {p?.full_name ? p.full_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div>
                          <p className="font-bold text-[--ag-text]">{p?.full_name ?? "Unknown"}</p>
                          <p className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">{p?.email ?? ""}</p>
                        </div>
                        {(() => {
                          const ev = p?.id ? evidenceSummaries[p.id] : undefined;
                          if (!ev || (ev.corroboratedSkills === 0 && ev.verifiedCertificates === 0)) return null;
                          return (
                            <span
                              className="inline-flex items-center gap-1 text-[10px] font-extrabold uppercase tracking-wider px-1.5 py-0.5 border bg-[--ag-success]/10 border-[--ag-success]/40 text-[--ag-success]"
                              title="Independently corroborated by SkillMatch"
                            >
                              <ShieldCheck className="h-3 w-3" />
                              {ev.verifiedCertificates > 0 && `${ev.verifiedCertificates} verified`}
                              {ev.verifiedCertificates > 0 && ev.corroboratedSkills > 0 && " · "}
                              {ev.corroboratedSkills > 0 && `${ev.corroboratedSkills} evidenced`}
                            </span>
                          );
                        })()}
                        <span className={cn("ml-auto text-xs font-bold px-2.5 py-1 border", STATUS_STYLES[app.status as Status] ?? "")}>
                          {app.status}
                        </span>
                      </div>

                      {p?.headline && (
                        <p className="text-sm text-[--ag-muted] mt-1 mb-2">{p.headline}</p>
                      )}

                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--ag-muted] mb-3">
                        <span>Applied to: <span className="font-bold text-[--ag-text]">{app.job?.title ?? "Unknown"}</span></span>
                        {goalPath && <span>{goalPath.emoji} <span className="text-[--ag-accent] font-bold">{goalPath.label}</span></span>}
                        <span>{relativeDate(app.applied_at)}</span>
                      </div>

                      {/* Skills — highlight matched ones if job is selected */}
                      {p?.skills && p.skills.length > 0 && (
                        <div className="flex flex-wrap gap-1.5">
                          {p.skills.slice(0, 8).map(s => {
                            const isMatched = app.breakdown?.matchedSkills.some(
                              ms => ms.toLowerCase().includes(s.toLowerCase()) || s.toLowerCase().includes(ms.toLowerCase())
                            );
                            return (
                              <span
                                key={s}
                                className={cn(
                                  "text-xs px-2 py-0.5 border font-bold",
                                  showScore && isMatched
                                    ? "bg-emerald-950/60 border-emerald-500/40 text-emerald-300"
                                    : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted]"
                                )}
                              >
                                {s}
                              </span>
                            );
                          })}
                          {p.skills.length > 8 && (
                            <span className="text-xs text-[--ag-muted]">+{p.skills.length - 8} more</span>
                          )}
                        </div>
                      )}

                      {/* Score breakdown bar (when job filter active) */}
                      {app.breakdown && jobFilter !== "all" && (
                        <div className="mt-3 pt-3 border-t border-[--ag-border]">
                          <div className="flex items-center gap-2 mb-1.5">
                            <span className="text-[10px] font-bold uppercase tracking-widest text-[--ag-muted]">Fit Score Breakdown</span>
                          </div>
                          <div className="grid grid-cols-5 gap-1.5 text-center">
                            {[
                              { label: "Skills", score: app.breakdown.skillsScore, max: 40 },
                              { label: "Domain", score: app.breakdown.domainScore, max: 20 },
                              { label: "Exp", score: app.breakdown.experienceScore, max: 20 },
                              { label: "Portfolio", score: app.breakdown.portfolioScore, max: 10 },
                              { label: "Profile", score: app.breakdown.completenessScore, max: 10 },
                            ].map(({ label, score, max }) => (
                              <div key={label} className="bg-[--ag-bg] border border-[--ag-border] px-1 py-1.5">
                                <div className="text-[10px] text-[--ag-muted] mb-1">{label}</div>
                                <div className="text-xs font-['JetBrains_Mono'] font-bold text-[--ag-accent]">
                                  {score}<span className="text-[--ag-muted] font-normal">/{max}</span>
                                </div>
                              </div>
                            ))}
                          </div>
                          {app.breakdown.missingSkills.length > 0 && (
                            <p className="text-[10px] text-[--ag-muted] mt-1.5">
                              Missing: {app.breakdown.missingSkills.slice(0, 4).join(", ")}
                              {app.breakdown.missingSkills.length > 4 && ` +${app.breakdown.missingSkills.length - 4} more`}
                            </p>
                          )}
                        </div>
                      )}
                    </div>

                    {/* Right: fit score + actions */}
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      {app.breakdown && <FitScoreBadge score={app.breakdown.total} breakdown={app.breakdown} />}

                      {p?.id && (
                        <button
                          onClick={() => navigate(`/hr/candidates/${p.id}`)}
                          className="text-xs px-3 py-1.5 border border-[--ag-accent]/40 text-[--ag-accent] font-bold hover:bg-[--ag-accent-dim] transition-all flex items-center gap-1.5 w-full justify-center"
                        >
                          <ExternalLink className="h-3 w-3" /> View Profile
                        </button>
                      )}

                      <div className="relative w-full">
                        <select
                          value={app.status}
                          onChange={e => updateStatus(app.id, e.target.value as Status)}
                          disabled={isUpdating}
                          className="w-full h-8 rounded-none border border-[--ag-border] bg-[--ag-bg] px-2 pr-6 text-xs text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none disabled:opacity-50"
                        >
                          {STATUSES.map(s => (
                            <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
                          ))}
                        </select>
                        <ChevronDown className="absolute right-1.5 top-1/2 -translate-y-1/2 h-3 w-3 text-[--ag-muted] pointer-events-none" />
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
