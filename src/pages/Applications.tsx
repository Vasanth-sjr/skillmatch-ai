import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { Briefcase, Building2, MapPin, ChevronRight, Filter } from "lucide-react";
import { cn } from "@/lib/utils";

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  cover_note: string | null;
  job: {
    id: string;
    title: string;
    career_domain: string | null;
    job_type: string;
    work_mode: string | null;
    salary_range: string | null;
    location: string | null;
    is_active: boolean;
    employer: { company_name: string | null; full_name: string | null } | null;
  } | null;
}

const STATUS_STYLES: Record<string, string> = {
  applied:     "bg-[--ag-accent]/10 text-[--ag-accent] border-[--ag-accent]/30",
  reviewing:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  shortlisted: "bg-green-50 text-green-700 border-green-200",
  rejected:    "bg-red-50 text-red-600 border-red-200",
  hired:       "bg-purple-50 text-purple-700 border-purple-200",
};

function relativeDate(iso: string) {
  const days = Math.floor((Date.now() - new Date(iso).getTime()) / 86400000);
  if (days === 0) return "Today";
  if (days === 1) return "Yesterday";
  if (days < 7) return `${days}d ago`;
  if (days < 30) return `${Math.floor(days / 7)}w ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

const ALL_STATUSES = ["all", "applied", "reviewing", "shortlisted", "hired", "rejected"];

export default function Applications() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const { data } = await (supabase as any)
        .from("applications")
        .select(`id, status, applied_at, cover_note,
          job:job_postings!job_id(
            id, title, career_domain, job_type, work_mode, salary_range, location, is_active,
            employer:profiles!employer_id(company_name, full_name)
          )`)
        .eq("applicant_id", user.id)
        .order("applied_at", { ascending: false });
      if (data) setApplications(data);
      setLoading(false);
    };
    load();
  }, [user]);

  const filtered = filter === "all" ? applications : applications.filter(a => a.status === filter);

  const counts: Record<string, number> = { all: applications.length };
  for (const s of ALL_STATUSES.slice(1)) {
    counts[s] = applications.filter(a => a.status === s).length;
  }

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6 max-w-4xl mx-auto space-y-6 pb-12">

          {/* Header */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-1">Job Seeker</p>
            <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight">My Applications</h1>
          </div>

          {/* Status filter tabs */}
          <div className="flex items-center gap-1 flex-wrap">
            <Filter className="h-3.5 w-3.5 text-[--ag-muted] mr-1" />
            {ALL_STATUSES.map(s => (
              <button
                key={s}
                onClick={() => setFilter(s)}
                className={cn(
                  "px-3 py-1.5 text-xs font-bold uppercase tracking-wide border transition-all",
                  filter === s
                    ? "bg-[--ag-accent] text-white border-[--ag-accent]"
                    : "bg-[--ag-surface] text-[--ag-muted] border-[--ag-border] hover:border-[--ag-accent]/40 hover:text-[--ag-text]"
                )}>
                {s} {counts[s] > 0 && <span className="ml-1 opacity-70">({counts[s]})</span>}
              </button>
            ))}
          </div>

          {/* List */}
          {loading ? (
            <div className="space-y-3">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="h-24 bg-[--ag-surface] border border-[--ag-border] animate-pulse" />
              ))}
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-20 border border-dashed border-[--ag-border]">
              <Briefcase className="h-10 w-10 text-[--ag-border] mx-auto mb-4" />
              {filter === "all" ? (
                <>
                  <p className="font-bold text-[--ag-muted] mb-3">You haven't applied to any jobs yet</p>
                  <button onClick={() => navigate("/careers")}
                    className="text-sm font-bold text-white bg-[--ag-accent] px-5 py-2.5 hover:brightness-110 transition-all">
                    Browse Open Jobs
                  </button>
                </>
              ) : (
                <p className="font-bold text-[--ag-muted]">No {filter} applications</p>
              )}
            </div>
          ) : (
            <div className="space-y-3">
              {filtered.map(app => {
                const company = app.job?.employer?.company_name || app.job?.employer?.full_name || "Company";
                const isActive = app.job?.is_active !== false;
                return (
                  <div key={app.id}
                    className={cn(
                      "bg-[--ag-surface] border p-5 flex items-center justify-between gap-4 transition-all",
                      isActive ? "border-[--ag-border] hover:border-[--ag-accent]/30" : "border-[--ag-border] opacity-70"
                    )}>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-['Syne'] font-bold text-[--ag-text]">{app.job?.title ?? "Unknown Position"}</h3>
                        {!isActive && (
                          <span className="text-xs font-bold text-[--ag-muted] border border-[--ag-border] px-1.5 py-0.5">Closed</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 text-xs text-[--ag-muted] flex-wrap">
                        <span className="flex items-center gap-1">
                          <Building2 className="h-3 w-3" /> {company}
                        </span>
                        {app.job?.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="h-3 w-3" /> {app.job.location}
                          </span>
                        )}
                        {app.job?.job_type && (
                          <span className="font-medium">{app.job.job_type}</span>
                        )}
                        {app.job?.work_mode && (
                          <span>{app.job.work_mode}</span>
                        )}
                        {app.job?.salary_range && (
                          <span className="font-['JetBrains_Mono'] text-[--ag-text]">{app.job.salary_range}</span>
                        )}
                      </div>
                      {app.cover_note && (
                        <p className="text-xs text-[--ag-muted] mt-2 line-clamp-1 italic">"{app.cover_note}"</p>
                      )}
                    </div>
                    <div className="flex flex-col items-end gap-2 shrink-0">
                      <span className={cn("text-xs font-bold px-2.5 py-1 border capitalize", STATUS_STYLES[app.status] ?? STATUS_STYLES.applied)}>
                        {app.status}
                      </span>
                      <span className="text-xs font-['JetBrains_Mono'] text-[--ag-muted]">{relativeDate(app.applied_at)}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {!loading && applications.length > 0 && (
            <p className="text-center text-xs text-[--ag-muted] font-['JetBrains_Mono']">
              {filtered.length} of {applications.length} applications
            </p>
          )}
        </main>
      </div>
    </div>
  );
}
