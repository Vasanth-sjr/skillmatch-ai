import { useEffect, useState } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { cn } from "@/lib/utils";
import {
  Brain, Target, TrendingUp, CheckCircle, XCircle, Loader2,
  BarChart3, Briefcase, User, Zap,
} from "lucide-react";

// ─── types ────────────────────────────────────────────────────────────────────

interface SkillDemand { skill: string; count: number; have: boolean }
interface AppFunnel  { status: string; count: number; color: string }

const STATUS_COLORS: Record<string, string> = {
  applied:     "bg-[--ag-accent]",
  reviewing:   "bg-[--ag-warning]",
  shortlisted: "bg-[--ag-success]",
  rejected:    "bg-[--ag-danger]",
  hired:       "bg-purple-500",
};
const STATUS_TEXT: Record<string, string> = {
  applied: "text-[--ag-accent]", reviewing: "text-[--ag-warning]",
  shortlisted: "text-[--ag-success]", rejected: "text-[--ag-danger]", hired: "text-purple-400",
};

// ─── profile completeness ────────────────────────────────────────────────────

function computeCompleteness(profile: ReturnType<typeof useAuth>["profile"]) {
  if (!profile) return { pct: 0, items: [] };
  const items = [
    { label: "Full name",     done: !!profile.full_name },
    { label: "Headline",      done: !!profile.headline },
    { label: "Bio",           done: !!profile.bio },
    { label: "Career goal",   done: !!profile.career_goal },
    { label: "Skills (5+)",   done: (profile.skills?.length || 0) >= 5 },
    { label: "Experience",    done: (profile.experience?.length || 0) > 0 },
    { label: "Education",     done: (profile.education?.length || 0) > 0 },
    { label: "GitHub URL",    done: !!profile.github_url },
    { label: "LinkedIn URL",  done: !!profile.linkedin_url },
    { label: "Portfolio URL", done: !!profile.portfolio_url },
  ];
  const pct = Math.round((items.filter(i => i.done).length / items.length) * 100);
  return { pct, items };
}

// ─── helper to normalize skill names ────────────────────────────────────────

function normSkill(s: string) {
  return s.toLowerCase().replace(/[\s.\-_]/g, "").replace(/js$/, "");
}

// ─── main component ─────────────────────────────────────────────────────────

const AIAnalysis = () => {
  const { user, profile } = useAuth();

  const [loading, setLoading]     = useState(true);
  const [jobCount, setJobCount]   = useState(0);
  const [skillDemand, setSkillDemand] = useState<SkillDemand[]>([]);
  const [appFunnel, setAppFunnel] = useState<AppFunnel[]>([]);
  const [totalApps, setTotalApps] = useState(0);

  const { pct: completeness, items: completenessItems } = computeCompleteness(profile);

  useEffect(() => {
    if (!user) return;

    const load = async () => {
      setLoading(true);
      const [jobsRes, appsRes] = await Promise.all([
        (supabase as any)
          .from("job_postings")
          .select("required_skills, career_domain")
          .eq("is_active", true),
        (supabase as any)
          .from("applications")
          .select("status")
          .eq("applicant_id", user.id),
      ]);

      // ── Skill demand ──
      const freq: Record<string, number> = {};
      const rawSkill: Record<string, string> = {}; // normalized → display
      for (const job of jobsRes.data || []) {
        for (const s of job.required_skills || []) {
          const n = normSkill(s);
          freq[n] = (freq[n] || 0) + 1;
          if (!rawSkill[n]) rawSkill[n] = s; // keep original casing
        }
      }
      const myNorms = new Set((profile?.skills || []).map(normSkill));
      const top = Object.entries(freq)
        .sort(([, a], [, b]) => b - a)
        .slice(0, 15)
        .map(([norm, count]) => ({
          skill: rawSkill[norm],
          count,
          have: myNorms.has(norm),
        }));
      setSkillDemand(top);
      setJobCount(jobsRes.data?.length || 0);

      // ── Application funnel ──
      const statusMap: Record<string, number> = {};
      for (const app of appsRes.data || []) {
        statusMap[app.status] = (statusMap[app.status] || 0) + 1;
      }
      const funnel = Object.entries(statusMap).map(([status, count]) => ({
        status,
        count,
        color: STATUS_COLORS[status] || "bg-[--ag-muted]",
      }));
      setAppFunnel(funnel);
      setTotalApps(appsRes.data?.length || 0);

      setLoading(false);
    };

    load();
  }, [user?.id, profile?.skills]);

  // ── derived insights ──────────────────────────────────────────────────────
  const haveCount    = skillDemand.filter(s => s.have).length;
  const missingTop   = skillDemand.filter(s => !s.have).slice(0, 3);
  const shortlisted  = appFunnel.find(f => f.status === "shortlisted")?.count || 0;
  const shortlistPct = totalApps > 0 ? Math.round((shortlisted / totalApps) * 100) : 0;

  // Smart action items
  const actions: string[] = [];
  if (missingTop.length > 0)
    actions.push(`Add "${missingTop[0].skill}" to your skills — required in ${missingTop[0].count} active jobs.`);
  if (completeness < 70)
    actions.push("Complete your profile to 70%+ for better candidate ranking and visibility.");
  if (totalApps === 0)
    actions.push("Apply to at least 5 jobs to start building your application history.");
  else if (shortlistPct < 20 && totalApps >= 3)
    actions.push("Your shortlist rate is below 20% — refine skills to match job requirements.");

  const maxDemand = skillDemand[0]?.count || 1;

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight flex items-center gap-3">
              <Brain className="h-8 w-8 text-[--ag-accent]" />
              AI Profile Analysis
            </h1>
            <p className="text-sm text-[--ag-muted] mt-1">
              Real insights from live job data and your profile — not simulated
            </p>
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24 gap-3 text-[--ag-muted]">
              <Loader2 className="h-5 w-5 animate-spin text-[--ag-accent]" />
              <span className="text-sm font-['JetBrains_Mono']">Analysing platform data…</span>
            </div>
          ) : (
            <div className="space-y-6 animate-in fade-in duration-400">

              {/* ── Stat cards ── */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                  { label: "Active Jobs", value: jobCount, icon: Briefcase, color: "text-[--ag-accent]", sub: "on platform" },
                  { label: "Skills Tracked", value: skillDemand.length, icon: BarChart3, color: "text-[--ag-accent]", sub: "in top demand" },
                  { label: "My Applications", value: totalApps, icon: Target, color: "text-[--ag-warning]", sub: `${shortlistPct}% shortlisted` },
                  { label: "Profile Score", value: `${completeness}%`, icon: User, color: completeness >= 70 ? "text-[--ag-success]" : "text-[--ag-warning]", sub: completeness >= 70 ? "Strong" : "Needs work" },
                ].map(({ label, value, icon: Icon, color, sub }) => (
                  <div key={label} className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon className={cn("h-4 w-4", color)} />
                      <p className="text-[10px] font-bold uppercase tracking-wider text-[--ag-muted]">{label}</p>
                    </div>
                    <p className="text-2xl font-['JetBrains_Mono'] font-extrabold text-[--ag-text]">{value}</p>
                    <p className="text-[10px] text-[--ag-muted] mt-0.5">{sub}</p>
                  </div>
                ))}
              </div>

              {/* ── Two-col layout ── */}
              <div className="grid lg:grid-cols-12 gap-6">

                {/* Skill Demand Map */}
                <div className="lg:col-span-7 rounded-none bg-[--ag-surface] border border-[--ag-border] p-5">
                  <div className="flex items-center justify-between mb-4">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] flex items-center gap-2">
                      <TrendingUp className="h-4 w-4 text-[--ag-accent]" />
                      Skill Demand — Top {skillDemand.length} across all active jobs
                    </h2>
                    <span className="text-xs text-[--ag-muted] font-['JetBrains_Mono']">
                      You have{" "}
                      <span className="text-[--ag-success] font-bold">{haveCount}</span>/{skillDemand.length}
                    </span>
                  </div>

                  {skillDemand.length === 0 ? (
                    <p className="text-xs text-[--ag-muted] py-6 text-center">No job postings yet — check back soon.</p>
                  ) : (
                    <div className="space-y-2.5">
                      {skillDemand.map(({ skill, count, have }) => (
                        <div key={skill} className="flex items-center gap-3">
                          <div className="w-28 shrink-0">
                            <p className={cn("text-xs font-bold truncate", have ? "text-[--ag-text]" : "text-[--ag-muted]")}>
                              {skill}
                            </p>
                          </div>
                          <div className="flex-1 h-2 bg-[--ag-bg] border border-[--ag-border] overflow-hidden">
                            <div
                              className={cn("h-full transition-all duration-700", have ? "bg-[--ag-success]" : "bg-[--ag-border]")}
                              style={{ width: `${(count / maxDemand) * 100}%` }}
                            />
                          </div>
                          <span className="text-[10px] font-['JetBrains_Mono'] text-[--ag-muted] w-6 text-right">{count}</span>
                          {have ? (
                            <CheckCircle className="h-3.5 w-3.5 text-[--ag-success] shrink-0" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-[--ag-border] shrink-0" />
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center gap-4 mt-4 pt-3 border-t border-[--ag-border]">
                    <span className="flex items-center gap-1.5 text-[10px] text-[--ag-muted]">
                      <CheckCircle className="h-3 w-3 text-[--ag-success]" /> You have it
                    </span>
                    <span className="flex items-center gap-1.5 text-[10px] text-[--ag-muted]">
                      <XCircle className="h-3 w-3 text-[--ag-border]" /> Missing
                    </span>
                  </div>
                </div>

                {/* Right column */}
                <div className="lg:col-span-5 space-y-5">

                  {/* Application Funnel */}
                  <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-5">
                    <h2 className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] flex items-center gap-2 mb-4">
                      <Target className="h-4 w-4 text-[--ag-warning]" />
                      My Application Funnel
                    </h2>
                    {appFunnel.length === 0 ? (
                      <p className="text-xs text-[--ag-muted] text-center py-4">
                        No applications yet. Start applying!
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {appFunnel.map(({ status, count, color }) => (
                          <div key={status} className="space-y-1">
                            <div className="flex items-center justify-between">
                              <span className={cn("text-xs font-bold capitalize", STATUS_TEXT[status] || "text-[--ag-muted]")}>
                                {status}
                              </span>
                              <span className="text-xs font-['JetBrains_Mono'] text-[--ag-text]">
                                {count} / {totalApps}
                              </span>
                            </div>
                            <div className="h-2 bg-[--ag-bg] border border-[--ag-border] overflow-hidden">
                              <div
                                className={cn("h-full transition-all duration-700", color)}
                                style={{ width: `${(count / totalApps) * 100}%` }}
                              />
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Profile Completeness */}
                  <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-5">
                    <div className="flex items-center justify-between mb-3">
                      <h2 className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] flex items-center gap-2">
                        <User className="h-4 w-4 text-[--ag-accent]" />
                        Profile Completeness
                      </h2>
                      <span className={cn(
                        "text-xl font-['JetBrains_Mono'] font-extrabold",
                        completeness >= 70 ? "text-[--ag-success]" : "text-[--ag-warning]",
                      )}>
                        {completeness}%
                      </span>
                    </div>

                    <div className="h-2 bg-[--ag-bg] border border-[--ag-border] overflow-hidden mb-4">
                      <div
                        className={cn("h-full transition-all duration-700", completeness >= 70 ? "bg-[--ag-success]" : "bg-[--ag-warning]")}
                        style={{ width: `${completeness}%` }}
                      />
                    </div>

                    <div className="grid grid-cols-2 gap-y-1.5">
                      {completenessItems.map(({ label, done }) => (
                        <div key={label} className="flex items-center gap-1.5">
                          {done ? (
                            <CheckCircle className="h-3 w-3 text-[--ag-success] shrink-0" />
                          ) : (
                            <XCircle className="h-3 w-3 text-[--ag-danger] shrink-0" />
                          )}
                          <span className={cn("text-[10px]", done ? "text-[--ag-muted]" : "text-[--ag-text] font-bold")}>
                            {label}
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* ── Smart action items ── */}
              {actions.length > 0 && (
                <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-5">
                  <h2 className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] flex items-center gap-2 mb-4">
                    <Zap className="h-4 w-4 text-[--ag-accent]" />
                    Smart Recommendations — based on real platform data
                  </h2>
                  <div className="space-y-3">
                    {actions.map((action, i) => (
                      <div key={i} className="flex items-start gap-3 p-3 bg-[--ag-bg] border border-[--ag-border]">
                        <span className="text-xs font-['JetBrains_Mono'] font-bold text-[--ag-accent] shrink-0 mt-0.5">
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <p className="text-sm text-[--ag-text]">{action}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default AIAnalysis;
