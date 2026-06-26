import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/hooks/use-toast";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { Briefcase, MapPin, Clock, Building2, CheckCircle, Search, X, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface JobPosting {
  id: string;
  title: string;
  description: string | null;
  required_skills: string[];
  location: string | null;
  salary_range: string | null;
  job_type: string;
  work_mode: string | null;
  experience_level: string | null;
  career_domain: string | null;
  created_at: string;
  employer: { full_name: string | null; company_name: string | null } | null;
}

interface ApplyTarget {
  job: JobPosting;
  companyName: string;
  matchPct: number;
}

function relativeDate(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  const days = Math.floor(diff / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString();
}

function calcMatch(job: JobPosting, userGoal: string | null, userSkills: string[]): number {
  let score = 0;
  if (userGoal && job.career_domain === userGoal) score += 60;
  const jobSkills = job.required_skills ?? [];
  const matched = jobSkills.filter(s =>
    userSkills.some(us => us.toLowerCase() === s.toLowerCase())
  ).length;
  score += Math.min(40, matched * 10);
  return Math.min(100, score);
}

function matchColor(pct: number) {
  if (pct >= 70) return "text-[--ag-success] bg-[--ag-success]/10 border-[--ag-success]/30";
  if (pct >= 40) return "text-[--ag-accent] bg-[--ag-accent]/10 border-[--ag-accent]/30";
  return "text-[--ag-muted] bg-[--ag-bg] border-[--ag-border]";
}

export default function Careers() {
  const { user, profile } = useAuth();
  const { toast } = useToast();

  const [jobs, setJobs] = useState<JobPosting[]>([]);
  const [appliedIds, setAppliedIds] = useState<Set<string>>(new Set());
  const [applying, setApplying] = useState(false);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [applyTarget, setApplyTarget] = useState<ApplyTarget | null>(null);
  const [coverNote, setCoverNote] = useState("");

  useEffect(() => {
    const load = async () => {
      if (!user) return;
      setLoading(true);

      const [{ data: jobData }, { data: appData }] = await Promise.all([
        (supabase as any)
          .from("job_postings")
          .select(`
            id, title, description, required_skills, location, salary_range,
            job_type, work_mode, experience_level, career_domain, created_at,
            employer:profiles!employer_id(full_name, company_name)
          `)
          .eq("is_active", true)
          .order("created_at", { ascending: false }),

        (supabase as any)
          .from("applications")
          .select("job_id")
          .eq("applicant_id", user.id),
      ]);

      if (jobData) setJobs(jobData);
      if (appData) setAppliedIds(new Set(appData.map((a: any) => a.job_id)));
      setLoading(false);
    };
    load();
  }, [user]);

  const openApplyModal = (job: JobPosting) => {
    const companyName = job.employer?.company_name ?? job.employer?.full_name ?? "Company";
    const matchPct = calcMatch(job, userGoal, userSkills);
    setCoverNote("");
    setApplyTarget({ job, companyName, matchPct });
  };

  const submitApply = async () => {
    if (!user || !applyTarget) return;
    setApplying(true);

    const { error } = await (supabase as any).from("applications").insert({
      job_id: applyTarget.job.id,
      applicant_id: user.id,
      status: "applied",
      cover_note: coverNote.trim() || null,
      applied_at: new Date().toISOString(),
    });

    if (error) {
      toast({ title: "Application failed", description: error.message, variant: "destructive" });
    } else {
      setAppliedIds(prev => new Set([...prev, applyTarget.job.id]));
      toast({ title: "Applied successfully!", description: `Your application to ${applyTarget.companyName} has been sent.` });
      setApplyTarget(null);
    }
    setApplying(false);
  };

  const userGoal = profile?.career_goal ?? null;
  const userSkills = profile?.skills ?? [];
  const matchedUserSkills = applyTarget
    ? (applyTarget.job.required_skills ?? []).filter(s =>
        userSkills.some(us => us.toLowerCase() === s.toLowerCase())
      )
    : [];

  const filtered = jobs.filter(j =>
    j.title.toLowerCase().includes(search.toLowerCase()) ||
    (j.location ?? "").toLowerCase().includes(search.toLowerCase()) ||
    (j.career_domain ?? "").toLowerCase().includes(search.toLowerCase())
  );

  const matched = filtered.filter(j => j.career_domain === userGoal);
  const others  = filtered.filter(j => j.career_domain !== userGoal);

  const goalPath = userGoal ? CAREER_PATHS[userGoal as CareerPathKey] : null;

  const JobCard = ({ job }: { job: JobPosting }) => {
    const pct = calcMatch(job, userGoal, userSkills);
    const hasApplied = appliedIds.has(job.id);
    const companyName = job.employer?.company_name ?? job.employer?.full_name ?? "Company";
    const domain = job.career_domain ? CAREER_PATHS[job.career_domain as CareerPathKey] : null;

    return (
      <div className="bg-[--ag-surface] border border-[--ag-border] p-5 hover:border-[--ag-accent]/50 hover:shadow-[0_4px_20px_-5px_rgba(14,116,144,0.12)] transition-all group">
        <div className="flex items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <div className="h-9 w-9 bg-[--ag-accent-dim] flex items-center justify-center shrink-0">
                <Building2 className="h-4 w-4 text-[--ag-accent]" />
              </div>
              <div>
                <h3 className="font-['Syne'] font-bold text-[--ag-text] group-hover:text-[--ag-accent] transition-colors">
                  {job.title}
                </h3>
                <p className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">{companyName}</p>
              </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-[--ag-muted] mb-3">
              {job.location && <span className="flex items-center gap-1"><MapPin className="h-3.5 w-3.5" />{job.location}</span>}
              <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{job.job_type}</span>
              {job.work_mode && <span className="font-medium">{job.work_mode}</span>}
              {job.experience_level && <span className="font-medium">{job.experience_level}</span>}
              {job.salary_range && <span className="font-['JetBrains_Mono'] text-[--ag-text] font-bold">{job.salary_range}</span>}
              <span className="text-[--ag-border]">{relativeDate(job.created_at)}</span>
            </div>

            {domain && (
              <span className="text-xs font-bold text-[--ag-accent] mr-2">{domain.emoji} {domain.label}</span>
            )}

            {job.required_skills?.length > 0 && (
              <div className="flex flex-wrap gap-1.5 mt-2">
                {job.required_skills.map(s => {
                  const matches = userSkills.some(us => us.toLowerCase() === s.toLowerCase());
                  return (
                    <span key={s}
                      className={cn("text-xs px-2 py-0.5 font-bold uppercase tracking-wider border",
                        matches ? "border-[--ag-success]/40 bg-[--ag-success]/10 text-[--ag-success]" : "border-[--ag-border] bg-[--ag-bg] text-[--ag-muted]"
                      )}>
                      {s}
                    </span>
                  );
                })}
              </div>
            )}

            {job.description && (
              <p className="text-sm text-[--ag-muted] mt-3 line-clamp-2">{job.description}</p>
            )}
          </div>

          <div className="flex flex-col items-end gap-3 shrink-0">
            {pct > 0 && (
              <span className={cn("px-2.5 py-1 border text-xs font-['JetBrains_Mono'] font-extrabold", matchColor(pct))}>
                {pct}% match
              </span>
            )}
            {hasApplied ? (
              <div className="flex items-center gap-1.5 text-[--ag-success] text-xs font-bold">
                <CheckCircle className="h-4 w-4" /> Applied
              </div>
            ) : (
              <Button size="sm" onClick={() => openApplyModal(job)}
                className="rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-wider text-xs hover:brightness-110">
                Apply
              </Button>
            )}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-[--ag-bg]">

      {/* Apply modal */}
      {applyTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={() => setApplyTarget(null)} />
          <div className="relative bg-[--ag-surface] border border-[--ag-border] w-full max-w-lg shadow-2xl">
            {/* Modal header */}
            <div className="flex items-start justify-between p-5 border-b border-[--ag-border]">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-1">Applying to</p>
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-lg">{applyTarget.job.title}</h2>
                <p className="text-sm text-[--ag-muted]">{applyTarget.companyName}</p>
              </div>
              <button onClick={() => setApplyTarget(null)} className="text-[--ag-muted] hover:text-[--ag-text] transition-colors p-1">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="p-5 space-y-4">
              {/* Match score */}
              {applyTarget.matchPct > 0 && (
                <div className="flex items-center gap-3 p-3 bg-[--ag-bg] border border-[--ag-border]">
                  <span className={cn("text-sm font-['JetBrains_Mono'] font-extrabold px-2 py-0.5 border", matchColor(applyTarget.matchPct))}>
                    {applyTarget.matchPct}% match
                  </span>
                  {matchedUserSkills.length > 0 && (
                    <p className="text-xs text-[--ag-muted]">
                      You have: <span className="font-bold text-[--ag-text]">{matchedUserSkills.join(", ")}</span>
                    </p>
                  )}
                </div>
              )}

              {/* Cover note */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">
                  Cover Note <span className="normal-case font-normal text-[--ag-muted]/60">(optional)</span>
                </label>
                <textarea
                  value={coverNote}
                  onChange={e => setCoverNote(e.target.value)}
                  placeholder="Briefly introduce yourself and why you're a great fit for this role…"
                  rows={4}
                  maxLength={500}
                  className="w-full rounded-none border border-[--ag-border] bg-[--ag-bg] px-3 py-2 text-sm text-[--ag-text] focus:outline-none focus:border-[--ag-accent] resize-none"
                />
                <p className="text-xs text-[--ag-muted] text-right font-['JetBrains_Mono']">{coverNote.length}/500</p>
              </div>

              {/* Profile summary reminder */}
              <div className="text-xs text-[--ag-muted] p-3 bg-[--ag-bg] border border-[--ag-border]">
                Your profile (skills, experience, education) is automatically sent with your application.
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-3 p-5 pt-0">
              <Button onClick={submitApply} disabled={applying}
                className="flex-1 rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest text-xs hover:brightness-110 disabled:opacity-60 flex items-center justify-center gap-2">
                {applying ? "Sending…" : <><Send className="h-3.5 w-3.5" /> Send Application</>}
              </Button>
              <Button variant="outline" onClick={() => setApplyTarget(null)}
                className="rounded-none border-[--ag-border] text-[--ag-muted] hover:text-[--ag-text] text-xs font-bold uppercase tracking-widest">
                Cancel
              </Button>
            </div>
          </div>
        </div>
      )}

      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6 space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight">
                Career Opportunities
              </h1>
              <p className="text-[--ag-muted] mt-1 text-sm">
                {goalPath
                  ? <>Showing jobs matched to your path: <span className="font-bold text-[--ag-text]">{goalPath.emoji} {goalPath.label}</span></>
                  : "Browse all open positions"}
              </p>
            </div>
          </div>

          {/* Search */}
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[--ag-muted]" />
            <Input
              placeholder="Search by title, location…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="pl-9 rounded-none border-[--ag-border] bg-[--ag-surface] focus:border-[--ag-accent]"
            />
          </div>

          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3].map(i => (
                <div key={i} className="h-36 bg-[--ag-surface] border border-[--ag-border] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[--ag-border]">
              <Briefcase className="h-10 w-10 text-[--ag-border] mx-auto mb-3" />
              <p className="font-bold text-[--ag-muted]">No jobs posted yet</p>
              <p className="text-xs text-[--ag-muted] mt-1">Check back soon — employers are posting new roles.</p>
            </div>
          ) : (
            <div className="space-y-8">
              {/* Matched jobs */}
              {matched.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[--ag-accent]">
                      Matched for you
                    </span>
                    <div className="h-px flex-1 bg-[--ag-accent]/20" />
                    <span className="text-xs text-[--ag-muted]">{matched.length} job{matched.length !== 1 ? "s" : ""}</span>
                  </div>
                  {matched.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              )}

              {/* Other jobs */}
              {others.length > 0 && (
                <div className="space-y-3">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">
                      {matched.length > 0 ? "Other opportunities" : "All opportunities"}
                    </span>
                    <div className="h-px flex-1 bg-[--ag-border]" />
                    <span className="text-xs text-[--ag-muted]">{others.length} job{others.length !== 1 ? "s" : ""}</span>
                  </div>
                  {others.map(job => <JobCard key={job.id} job={job} />)}
                </div>
              )}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
