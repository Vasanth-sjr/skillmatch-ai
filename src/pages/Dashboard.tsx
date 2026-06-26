import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import {
  Briefcase, CheckCircle2, Target, User, ArrowRight,
  MapPin, Building2, ChevronRight, ClipboardCheck, Printer, Map,
  Brain, Video, BookOpen, FileEdit, Star,
} from "lucide-react";
import { cn } from "@/lib/utils";

// ─── Types ────────────────────────────────────────────────────────────────────

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  job: {
    id: string;
    title: string;
    career_domain: string | null;
    job_type: string;
    location: string | null;
    employer: { company_name: string | null; full_name: string | null } | null;
  } | null;
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

function calcProfileStrength(profile: any) {
  const checks = [
    !!profile?.full_name, !!profile?.headline, !!profile?.bio,
    !!profile?.career_goal, (profile?.skills?.length ?? 0) >= 3,
    (profile?.experience?.length ?? 0) >= 1, (profile?.education?.length ?? 0) >= 1,
    (profile?.projects?.length ?? 0) >= 1, (profile?.certifications?.length ?? 0) >= 1,
    !!(profile?.linkedin_url || profile?.github_url || profile?.portfolio_url),
  ];
  return Math.round((checks.filter(Boolean).length / checks.length) * 100);
}

// ─── Stat card ────────────────────────────────────────────────────────────────

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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function Dashboard() {
  const { user, profile } = useAuth();
  const navigate = useNavigate();

  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [matchedJobsCount, setMatchedJobsCount] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: apps }, { count: matched }] = await Promise.all([
        (supabase as any)
          .from("applications")
          .select(`id, status, applied_at,
            job:job_postings!job_id(id, title, career_domain, job_type, location,
              employer:profiles!employer_id(company_name, full_name))`)
          .eq("applicant_id", user.id)
          .order("applied_at", { ascending: false })
          .limit(20),

        profile?.career_goal
          ? (supabase as any)
              .from("job_postings")
              .select("id", { count: "exact", head: true })
              .eq("career_domain", profile.career_goal)
              .eq("is_active", true)
          : Promise.resolve({ count: 0 }),
      ]);

      if (apps) setApplications(apps);
      setMatchedJobsCount(matched ?? 0);
      setLoading(false);
    };
    load();
  }, [user, profile?.career_goal]);

  const displayName = profile?.full_name || user?.user_metadata?.full_name || user?.email?.split("@")[0] || "there";
  const goalPath = profile?.career_goal ? CAREER_PATHS[profile.career_goal as CareerPathKey] : null;
  const profileStrength = calcProfileStrength(profile);

  const totalApps = applications.length;
  const shortlisted = applications.filter(a => a.status === "shortlisted" || a.status === "hired").length;

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen">
        <DashboardHeader />
        <main className="p-6 max-w-5xl mx-auto space-y-6 pb-12">

          {/* Welcome */}
          <div className="bg-[--ag-surface] border border-[--ag-border] p-6 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-48 h-48 bg-[--ag-accent]/5 rounded-full -translate-y-24 translate-x-24" />
            <div className="relative">
              <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-1">Welcome back</p>
              <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight mb-3">
                {displayName}
              </h1>
              {goalPath ? (
                <div className="inline-flex items-center gap-2 px-3 py-1.5 bg-[--ag-accent-dim] border border-[--ag-accent]/30">
                  <span>{goalPath.emoji}</span>
                  <span className="text-xs font-bold text-[--ag-accent] uppercase tracking-wider">{goalPath.label}</span>
                  <span className="text-xs text-[--ag-muted]">·</span>
                  <span className="text-xs text-[--ag-muted]">{goalPath.salaryRange}</span>
                </div>
              ) : (
                <button onClick={() => navigate("/onboarding/jobseeker")}
                  className="inline-flex items-center gap-2 px-3 py-1.5 border border-dashed border-[--ag-accent] text-[--ag-accent] text-xs font-bold hover:bg-[--ag-accent-dim] transition-colors">
                  Set your career goal →
                </button>
              )}
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <StatCard label="Applications Sent" value={loading ? "—" : totalApps} icon={Briefcase} accent />
            <StatCard label="Shortlisted" value={loading ? "—" : shortlisted} icon={CheckCircle2} />
            <StatCard label="Jobs Matching You" value={loading ? "—" : matchedJobsCount} icon={Target} />
            <StatCard label="Profile Strength" value={`${profileStrength}%`} icon={User} />
          </div>

          {/* Profile completion nudge */}
          {profileStrength < 80 && (
            <div className="bg-[--ag-surface] border border-[--ag-accent]/30 p-4 flex items-center justify-between gap-4">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold text-[--ag-text] mb-1.5">Complete your profile to get more matches</p>
                <div className="h-1.5 bg-[--ag-border]">
                  <div className="h-full bg-[--ag-accent] transition-all" style={{ width: `${profileStrength}%` }} />
                </div>
                <p className="text-xs text-[--ag-muted] mt-1">{profileStrength}% complete</p>
              </div>
              <button onClick={() => navigate("/profile")}
                className="flex items-center gap-1.5 text-xs font-bold text-white bg-[--ag-accent] px-4 py-2 hover:brightness-110 transition-all shrink-0">
                Update Profile <ArrowRight className="h-3.5 w-3.5" />
              </button>
            </div>
          )}

          {/* AI Tools grid */}
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-3">Your AI Toolkit</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "AI Analysis",        sub: "Profile insights & gaps",      path: "/ai-analysis",   icon: Brain,         color: "text-purple-400",        bg: "bg-purple-400/10  border-purple-400/20"  },
                { label: "ATS Checker",        sub: "Resume & JD keyword match",    path: "/ats-check",     icon: ClipboardCheck, color: "text-[--ag-accent]",    bg: "bg-[--ag-accent-dim] border-[--ag-accent]/20" },
                { label: "Skill Reviews",      sub: "Self-rate your 20 skills",     path: "/skill-reviews", icon: Star,           color: "text-yellow-400",        bg: "bg-yellow-400/10  border-yellow-400/20"  },
                { label: "Mock Interviews",    sub: "Practice & rate answers",      path: "/interviews",    icon: Video,          color: "text-green-400",         bg: "bg-green-400/10   border-green-400/20"   },
                { label: "Career Roadmap",     sub: "Personalized 6-month plan",    path: "/roadmap",       icon: Map,            color: "text-[--ag-accent]",    bg: "bg-[--ag-accent-dim] border-[--ag-accent]/20" },
                { label: "Learning Resources", sub: "Courses, videos & tools",      path: "/events",        icon: BookOpen,       color: "text-sky-400",           bg: "bg-sky-400/10     border-sky-400/20"    },
                { label: "Resume Builder",     sub: "Build a custom resume",        path: "/resume-builder",icon: FileEdit,       color: "text-orange-400",        bg: "bg-orange-400/10  border-orange-400/20"  },
                { label: "My Resume",          sub: "Profile resume · A4 print",    path: "/resume",        icon: Printer,        color: "text-[--ag-muted]",     bg: "bg-[--ag-surface] border-[--ag-border]"  },
              ].map(({ label, sub, path, icon: Icon, color, bg }) => (
                <button
                  key={path}
                  onClick={() => navigate(path)}
                  className={cn(
                    "flex flex-col items-start gap-2 p-4 border text-left hover:scale-[1.02] transition-all duration-200 group",
                    bg,
                  )}
                >
                  <Icon className={cn("h-5 w-5", color)} />
                  <div>
                    <p className="text-sm font-bold text-[--ag-text] group-hover:text-[--ag-accent] transition-colors">{label}</p>
                    <p className="text-xs text-[--ag-muted] leading-snug mt-0.5">{sub}</p>
                  </div>
                </button>
              ))}
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-6">
            {/* Recent applications */}
            <div className="lg:col-span-2 bg-[--ag-surface] border border-[--ag-border] p-5">
              <div className="flex items-center justify-between mb-4">
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide">
                  Recent Applications
                </h2>
                {applications.length > 0 && (
                  <button onClick={() => navigate("/applications")}
                    className="text-xs text-[--ag-accent] hover:underline flex items-center gap-1">
                    View all <ChevronRight className="h-3.5 w-3.5" />
                  </button>
                )}
              </div>

              {loading ? (
                <div className="space-y-3">
                  {[1, 2, 3].map(i => <div key={i} className="h-16 bg-[--ag-bg] border border-[--ag-border] animate-pulse" />)}
                </div>
              ) : applications.length === 0 ? (
                <div className="text-center py-12 border border-dashed border-[--ag-border]">
                  <Briefcase className="h-8 w-8 text-[--ag-border] mx-auto mb-3" />
                  <p className="text-sm font-bold text-[--ag-muted]">No applications yet</p>
                  <button onClick={() => navigate("/careers")}
                    className="mt-3 text-xs text-[--ag-accent] hover:underline">
                    Browse open jobs →
                  </button>
                </div>
              ) : (
                <div className="space-y-2">
                  {applications.slice(0, 6).map(app => {
                    const company = app.job?.employer?.company_name || app.job?.employer?.full_name || "Company";
                    return (
                      <div key={app.id} className="flex items-center justify-between gap-3 p-3 bg-[--ag-bg] border border-[--ag-border] hover:border-[--ag-accent]/30 transition-colors">
                        <div className="flex-1 min-w-0">
                          <p className="font-bold text-[--ag-text] text-sm truncate">{app.job?.title ?? "Unknown"}</p>
                          <p className="text-xs text-[--ag-muted] flex items-center gap-2 mt-0.5">
                            <Building2 className="h-3 w-3" /> {company}
                            {app.job?.location && <><MapPin className="h-3 w-3" />{app.job.location}</>}
                          </p>
                        </div>
                        <div className="flex items-center gap-3 shrink-0">
                          <span className={cn("text-xs font-bold px-2 py-0.5 border capitalize", STATUS_STYLES[app.status] ?? STATUS_STYLES.applied)}>
                            {app.status}
                          </span>
                          <span className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">{relativeDate(app.applied_at)}</span>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Quick actions */}
            <div className="space-y-4">
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-4">Quick Actions</h2>
                <div className="space-y-2">
                  {[
                    { label: "Career Roadmap",   sub: "Your personalized 6-month plan",      path: "/roadmap",       icon: Map,          primary: true  },
                    { label: "Browse Jobs",       sub: `${matchedJobsCount} matched to you`,  path: "/careers",       icon: Briefcase,    primary: false },
                    { label: "My Applications",   sub: `${totalApps} sent so far`,            path: "/applications",  icon: CheckCircle2, primary: false },
                    { label: "Skill Reviews",     sub: "Self-assess your skills",             path: "/skill-reviews", icon: Star,         primary: false },
                    { label: "AI Analysis",       sub: "Profile insights & gaps",             path: "/ai-analysis",   icon: Brain,        primary: false },
                    { label: "Edit Profile",      sub: `${profileStrength}% complete`,        path: "/profile",       icon: User,         primary: false },
                  ].map(({ label, sub, path, icon: Icon, primary }) => (
                    <button key={path} onClick={() => navigate(path)}
                      className={cn(
                        "w-full flex items-center justify-between gap-3 p-3 border transition-all text-left",
                        primary
                          ? "bg-[--ag-accent] border-[--ag-accent] text-white hover:brightness-110"
                          : "bg-[--ag-bg] border-[--ag-border] hover:border-[--ag-accent]/40"
                      )}>
                      <div className="flex items-center gap-3">
                        <Icon className={cn("h-4 w-4 shrink-0", primary ? "text-white" : "text-[--ag-accent]")} />
                        <div>
                          <p className={cn("text-sm font-bold", primary ? "text-white" : "text-[--ag-text]")}>{label}</p>
                          <p className={cn("text-xs", primary ? "text-white/70" : "text-[--ag-muted]")}>{sub}</p>
                        </div>
                      </div>
                      <ChevronRight className={cn("h-4 w-4 shrink-0", primary ? "text-white/70" : "text-[--ag-muted]")} />
                    </button>
                  ))}
                </div>
              </div>

              {/* Career goal card */}
              {goalPath && (
                <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                  <p className="text-xs font-bold uppercase tracking-widest text-[--ag-muted] mb-3">Your Target Path</p>
                  <p className="text-2xl mb-2">{goalPath.emoji}</p>
                  <p className="font-['Syne'] font-bold text-[--ag-text]">{goalPath.label}</p>
                  <p className="text-xs text-[--ag-muted] mt-1 leading-relaxed">{goalPath.tagline}</p>
                  <div className="mt-3 pt-3 border-t border-[--ag-border] flex items-center justify-between">
                    <span className="text-xs font-bold text-[--ag-muted]">Salary range</span>
                    <span className="text-xs font-['JetBrains_Mono'] font-bold text-[--ag-accent]">{goalPath.salaryRange}</span>
                  </div>
                  <div className="flex items-center justify-between mt-1">
                    <span className="text-xs font-bold text-[--ag-muted]">Demand</span>
                    <span className={cn("text-xs font-bold",
                      goalPath.demandLevel === "Explosive" ? "text-[--ag-success]" : "text-[--ag-accent]")}>
                      {goalPath.demandLevel}
                    </span>
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
