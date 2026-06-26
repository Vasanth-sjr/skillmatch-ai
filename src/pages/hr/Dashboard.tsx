import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import {
  Briefcase, Users, CheckCircle2, TrendingUp,
  ChevronRight, Building2, Plus,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationSummary {
  id: string;
  status: string;
  applied_at: string;
  job_title: string;
  applicant_name: string | null;
  applicant_email: string | null;
  career_goal: string | null;
}

interface JobRow {
  id: string;
  title: string;
  is_active: boolean;
  applications: { id: string; status: string; applied_at: string; applicant: {
    id: string; full_name: string | null; email: string | null; career_goal: string | null;
  } | null }[];
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

const STATUS_STYLES: Record<string, string> = {
  applied:     "bg-[--ag-accent]/10 text-[--ag-accent] border-[--ag-accent]/30",
  reviewing:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  shortlisted: "bg-green-50 text-green-700 border-green-200",
  rejected:    "bg-red-50 text-red-600 border-red-200",
  hired:       "bg-purple-50 text-purple-700 border-purple-200",
};

const PIPELINE_STAGES = ["applied", "reviewing", "shortlisted", "hired"] as const;

// ─── Stat card ────────────────────────────────────────────────────────────────

function StatCard({ label, value, icon: Icon, accent, sub }: {
  label: string; value: string | number; icon: React.ElementType; accent?: boolean; sub?: string;
}) {
  return (
    <div className={cn("bg-[--ag-surface] border p-5", accent ? "border-[--ag-accent]/40" : "border-[--ag-border]")}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted]">{label}</p>
        <Icon className={cn("h-4 w-4", accent ? "text-[--ag-accent]" : "text-[--ag-muted]")} />
      </div>
      <p className={cn("text-3xl font-['JetBrains_Mono'] font-extrabold", accent ? "text-[--ag-accent]" : "text-[--ag-text]")}>
        {value}
      </p>
      {sub && <p className="text-xs text-[--ag-muted] mt-1">{sub}</p>}
    </div>
  );
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function HRDashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [jobs, setJobs] = useState<JobRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("job_postings")
        .select(`
          id, title, is_active, created_at,
          applications:applications(
            id, status, applied_at,
            applicant:profiles!applicant_id(id, full_name, email, career_goal)
          )
        `)
        .eq("employer_id", user.id)
        .order("created_at", { ascending: false });

      if (data) setJobs(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const companyName = profile?.company_name || profile?.full_name || "your company";
  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";

  const activeJobs = jobs.filter(j => j.is_active).length;
  const allApps: ApplicationSummary[] = jobs.flatMap(j =>
    (j.applications || []).map(a => ({
      id: a.id,
      status: a.status,
      applied_at: a.applied_at,
      job_title: j.title,
      applicant_name: a.applicant?.full_name ?? null,
      applicant_email: a.applicant?.email ?? null,
      career_goal: a.applicant?.career_goal ?? null,
    }))
  ).sort((a, b) => new Date(b.applied_at).getTime() - new Date(a.applied_at).getTime());

  const totalApps = allApps.length;
  const shortlisted = allApps.filter(a => a.status === "shortlisted" || a.status === "hired").length;
  const hired = allApps.filter(a => a.status === "hired").length;

  const pipelineCounts: Record<string, number> = {};
  PIPELINE_STAGES.forEach(s => { pipelineCounts[s] = allApps.filter(a => a.status === s).length; });
  const maxPipeline = Math.max(...Object.values(pipelineCounts), 1);

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Welcome header */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-6 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-48 h-48 bg-[--ag-accent]/5 rounded-full -translate-y-24 translate-x-24" />
          <div className="relative flex items-start justify-between gap-4">
            <div>
              <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-1">HR Dashboard</p>
              <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight">
                Welcome, {displayName}
              </h1>
              {profile?.company_name && (
                <div className="inline-flex items-center gap-2 mt-2 px-3 py-1 bg-[--ag-accent-dim] border border-[--ag-accent]/30">
                  <Building2 className="h-3.5 w-3.5 text-[--ag-accent]" />
                  <span className="text-xs font-bold text-[--ag-accent]">{profile.company_name}</span>
                </div>
              )}
            </div>
            <button onClick={() => navigate("/hr/jobs")}
              className="flex items-center gap-2 bg-[--ag-accent] text-white px-4 py-2.5 text-sm font-bold hover:brightness-110 transition-all shrink-0">
              <Plus className="h-4 w-4" /> Post Job
            </button>
          </div>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard label="Active Jobs" value={loading ? "—" : activeJobs} icon={Briefcase} accent
            sub={loading ? undefined : `${jobs.length} total postings`} />
          <StatCard label="Total Applicants" value={loading ? "—" : totalApps} icon={Users} />
          <StatCard label="Shortlisted" value={loading ? "—" : shortlisted} icon={CheckCircle2} />
          <StatCard label="Hired" value={loading ? "—" : hired} icon={TrendingUp} />
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Hiring pipeline */}
          <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
            <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-5">
              Hiring Pipeline
            </h2>
            {loading ? (
              <div className="space-y-4">
                {[1, 2, 3, 4].map(i => <div key={i} className="h-8 bg-[--ag-bg] animate-pulse" />)}
              </div>
            ) : totalApps === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[--ag-muted]">No applications yet</p>
              </div>
            ) : (
              <div className="space-y-4">
                {PIPELINE_STAGES.map(stage => {
                  const count = pipelineCounts[stage];
                  const pct = Math.round((count / maxPipeline) * 100);
                  return (
                    <div key={stage}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-xs font-bold text-[--ag-text] capitalize">{stage}</span>
                        <span className="text-xs font-['JetBrains_Mono'] font-bold text-[--ag-muted]">{count}</span>
                      </div>
                      <div className="h-2 bg-[--ag-bg] border border-[--ag-border]">
                        <div
                          className={cn("h-full transition-all",
                            stage === "hired" ? "bg-purple-500" :
                            stage === "shortlisted" ? "bg-green-500" :
                            stage === "reviewing" ? "bg-yellow-400" : "bg-[--ag-accent]"
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                    </div>
                  );
                })}
                <div className="pt-3 border-t border-[--ag-border]">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-[--ag-muted]">Conversion rate</span>
                    <span className="text-xs font-['JetBrains_Mono'] font-bold text-[--ag-accent]">
                      {totalApps > 0 ? Math.round((hired / totalApps) * 100) : 0}%
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Recent applicants */}
          <div className="lg:col-span-2 bg-[--ag-surface] border border-[--ag-border] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide">
                Recent Applicants
              </h2>
              <button onClick={() => navigate("/hr/candidates")}
                className="text-xs text-[--ag-accent] hover:underline flex items-center gap-1">
                View all <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>

            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[--ag-bg] animate-pulse border border-[--ag-border]" />)}
              </div>
            ) : allApps.length === 0 ? (
              <div className="text-center py-12 border border-dashed border-[--ag-border]">
                <Users className="h-8 w-8 text-[--ag-border] mx-auto mb-3" />
                <p className="text-sm font-bold text-[--ag-muted]">No applicants yet</p>
                <button onClick={() => navigate("/hr/jobs")}
                  className="mt-3 text-xs text-[--ag-accent] hover:underline">
                  Post a job to start receiving applications →
                </button>
              </div>
            ) : (
              <div className="space-y-2">
                {allApps.slice(0, 6).map(app => {
                  const goalPath = app.career_goal ? CAREER_PATHS[app.career_goal as CareerPathKey] : null;
                  return (
                    <div key={app.id}
                      onClick={() => navigate("/hr/candidates")}
                      className="flex items-center justify-between gap-3 p-3 bg-[--ag-bg] border border-[--ag-border] hover:border-[--ag-accent]/30 transition-colors cursor-pointer">
                      <div className="flex items-center gap-3 flex-1 min-w-0">
                        <div className="h-8 w-8 bg-[--ag-accent-dim] flex items-center justify-center shrink-0 font-bold text-[--ag-accent] text-sm">
                          {app.applicant_name ? app.applicant_name.charAt(0).toUpperCase() : "?"}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[--ag-text] text-sm truncate">{app.applicant_name ?? "Unknown"}</p>
                          <p className="text-xs text-[--ag-muted] truncate">
                            {app.job_title}
                            {goalPath && <span className="ml-2">{goalPath.emoji} {goalPath.label}</span>}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3 shrink-0">
                        <span className={cn("text-xs font-bold px-2 py-0.5 border capitalize", STATUS_STYLES[app.status] ?? STATUS_STYLES.applied)}>
                          {app.status}
                        </span>
                        <span className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">{relativeDate(app.applied_at)}</span>
                        <ChevronRight className="h-3.5 w-3.5 text-[--ag-muted]" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Active jobs list */}
        {!loading && jobs.filter(j => j.is_active).length > 0 && (
          <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide">
                Active Postings
              </h2>
              <button onClick={() => navigate("/hr/jobs")}
                className="text-xs text-[--ag-accent] hover:underline flex items-center gap-1">
                Manage jobs <ChevronRight className="h-3.5 w-3.5" />
              </button>
            </div>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {jobs.filter(j => j.is_active).slice(0, 6).map(job => {
                const appCount = (job.applications || []).length;
                return (
                  <div key={job.id}
                    onClick={() => navigate(`/hr/candidates?job=${job.id}`)}
                    className="p-4 bg-[--ag-bg] border border-[--ag-border] hover:border-[--ag-accent]/40 transition-colors cursor-pointer">
                    <p className="font-bold text-[--ag-text] text-sm truncate mb-1">{job.title}</p>
                    <p className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">
                      {appCount} applicant{appCount !== 1 ? "s" : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
