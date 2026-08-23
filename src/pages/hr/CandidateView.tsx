import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/hr/DashboardLayout";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import {
  ArrowLeft, User, Briefcase, GraduationCap, Globe, Github, Linkedin,
  MapPin, Mail, CheckCircle2, ChevronDown,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { VerifiedEvidence } from "@/components/hr/VerifiedEvidence";
import {
  loadCandidateSkillEvidence, loadCandidateCertificates, loadCandidateAnswers,
  CandidateSkillEvidence, CandidateCertificate, CandidateAnswer,
} from "@/lib/amsce/candidateEvidence";
import { CandidateAnswers } from "@/components/hr/CandidateAnswers";
import { recordHiringOutcome, HiringOutcome } from "@/lib/amsce/outcomeFeedback";

// ─── Types ────────────────────────────────────────────────────────────────────

interface CandidateProfile {
  id: string;
  full_name: string | null;
  email: string | null;
  headline: string | null;
  bio: string | null;
  location: string | null;
  career_goal: string | null;
  skills: string[];
  experience: any[];
  education: any[];
  linkedin_url: string | null;
  github_url: string | null;
  portfolio_url: string | null;
  certifications: any[];
}

interface ApplicationRow {
  id: string;
  status: string;
  applied_at: string;
  cover_note: string | null;
  job: { id: string; title: string } | null;
}

const STATUSES = ["applied", "reviewing", "shortlisted", "rejected", "hired"] as const;
type Status = typeof STATUSES[number];

const STATUS_STYLES: Record<Status, string> = {
  applied:     "bg-[--ag-accent]/10 text-[--ag-accent] border-[--ag-accent]/30",
  reviewing:   "bg-yellow-50 text-yellow-700 border-yellow-200",
  shortlisted: "bg-green-50 text-green-700 border-green-200",
  rejected:    "bg-red-50 text-red-600 border-red-200",
  hired:       "bg-purple-50 text-purple-700 border-purple-200",
};

function relativeDate(iso: string) {
  const d = new Date(iso);
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

// ─── Experience / Education normalizer ────────────────────────────────────────

function expLabel(e: any) {
  const start = e.startMonth && e.startYear ? `${e.startMonth} ${e.startYear}` : (e.startYear ?? e.duration ?? "");
  const end = e.current ? "Present" : (e.endMonth && e.endYear ? `${e.endMonth} ${e.endYear}` : (e.endYear ?? ""));
  return [start, end].filter(Boolean).join(" – ");
}

function eduLabel(e: any) {
  const start = e.startYear ?? "";
  const end = e.endYear ?? e.year ?? "";
  return [start, end].filter(Boolean).join(" – ");
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CandidateView() {
  const { id } = useParams<{ id: string }>();  // profile ID of the candidate
  const { user } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [candidate, setCandidate] = useState<CandidateProfile | null>(null);
  const [applications, setApplications] = useState<ApplicationRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState<string | null>(null);
  const [skillEvidence, setSkillEvidence] = useState<CandidateSkillEvidence[]>([]);
  const [certificates, setCertificates] = useState<CandidateCertificate[]>([]);
  const [answers, setAnswers] = useState<CandidateAnswer[]>([]);

  useEffect(() => {
    if (!id || !user) return;
    const load = async () => {
      setLoading(true);
      const [{ data: profile }, { data: apps }] = await Promise.all([
        (supabase as any)
          .from("profiles")
          .select("id, full_name, email, headline, bio, location, career_goal, skills, experience, education, linkedin_url, github_url, portfolio_url, certifications")
          .eq("id", id)
          .single(),

        (supabase as any)
          .from("applications")
          .select("id, status, applied_at, cover_note, job:job_postings!job_id(id, title, employer_id)")
          .eq("applicant_id", id)
          .order("applied_at", { ascending: false }),
      ]);

      if (profile) {
        setCandidate(profile);
        // AMSCE evidence is loaded after the profile because the
        // certificate join needs the profile's certifications array.
        const [evidence, certs, sharedAnswers] = await Promise.all([
          loadCandidateSkillEvidence(id),
          loadCandidateCertificates(id, profile.certifications ?? []),
          // Returns [] when the candidate hasn't consented — the RLS
          // policy simply yields no rows, and we don't distinguish that
          // from having written nothing.
          loadCandidateAnswers(id),
        ]);
        setSkillEvidence(evidence);
        setCertificates(certs);
        setAnswers(sharedAnswers);
      }

      // Only show applications for this employer's jobs
      if (apps) {
        const myApps = apps.filter((a: any) => a.job?.employer_id === user.id);
        setApplications(myApps);
      }
      setLoading(false);
    };
    load();
  }, [id, user]);

  const updateStatus = async (appId: string, newStatus: Status) => {
    setUpdating(appId);
    const { error } = await (supabase as any)
      .from("applications")
      .update({ status: newStatus })
      .eq("id", appId);

    if (error) {
      toast({ title: "Update failed", description: error.message, variant: "destructive" });
    } else {
      setApplications(prev => prev.map(a => a.id === appId ? { ...a, status: newStatus } : a));
      toast({ title: `Status → ${newStatus}` });

      // Freeze what AMSCE said at the moment of the decision. Reading the
      // live scores later would show what the engine thinks now, not what
      // this employer was actually shown when they decided.
      //
      // Fire-and-forget: feedback data is valuable but not worth blocking
      // a hiring workflow over.
      if (id && user && ["shortlisted", "rejected", "hired"].includes(newStatus)) {
        recordHiringOutcome(appId, id, user.id, newStatus as HiringOutcome, skillEvidence);
      }
    }
    setUpdating(null);
  };

  const goalPath = candidate?.career_goal ? CAREER_PATHS[candidate.career_goal as CareerPathKey] : null;

  if (loading) {
    return (
      <DashboardLayout>
        <div className="space-y-4 animate-pulse">
          <div className="h-8 w-32 bg-[--ag-surface]" />
          <div className="h-40 bg-[--ag-surface] border border-[--ag-border]" />
          <div className="grid lg:grid-cols-3 gap-4">
            {[1, 2, 3].map(i => <div key={i} className="h-48 bg-[--ag-surface] border border-[--ag-border]" />)}
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!candidate) {
    return (
      <DashboardLayout>
        <div className="text-center py-20 border border-dashed border-[--ag-border]">
          <User className="h-10 w-10 text-[--ag-border] mx-auto mb-4" />
          <p className="font-bold text-[--ag-muted]">Candidate not found</p>
          <button onClick={() => navigate("/hr/candidates")}
            className="mt-4 text-xs text-[--ag-accent] hover:underline">← Back to candidates</button>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="space-y-6">

        {/* Back */}
        <button onClick={() => navigate("/hr/candidates")}
          className="inline-flex items-center gap-2 text-xs font-bold text-[--ag-muted] hover:text-[--ag-accent] transition-colors">
          <ArrowLeft className="h-3.5 w-3.5" /> Back to candidates
        </button>

        {/* Identity card */}
        <div className="bg-[--ag-surface] border border-[--ag-border] p-6">
          <div className="flex items-start gap-5">
            <div className="h-14 w-14 bg-[--ag-accent-dim] flex items-center justify-center shrink-0 font-black text-xl text-[--ag-accent]">
              {candidate.full_name ? candidate.full_name.charAt(0).toUpperCase() : "?"}
            </div>
            <div className="flex-1 min-w-0">
              <h1 className="text-2xl font-['Syne'] font-extrabold text-[--ag-text]">{candidate.full_name ?? "Unknown"}</h1>
              {candidate.headline && <p className="text-[--ag-muted] mt-0.5">{candidate.headline}</p>}
              <div className="flex flex-wrap gap-3 mt-2 text-xs text-[--ag-muted]">
                {candidate.email && (
                  <span className="flex items-center gap-1"><Mail className="h-3 w-3" /> {candidate.email}</span>
                )}
                {candidate.location && (
                  <span className="flex items-center gap-1"><MapPin className="h-3 w-3" /> {candidate.location}</span>
                )}
                {goalPath && (
                  <span className="flex items-center gap-1 font-bold text-[--ag-accent]">
                    {goalPath.emoji} {goalPath.label}
                  </span>
                )}
              </div>
              <div className="flex gap-3 mt-3">
                {candidate.linkedin_url && (
                  <a href={candidate.linkedin_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-[--ag-accent] hover:underline">
                    <Linkedin className="h-3.5 w-3.5" /> LinkedIn
                  </a>
                )}
                {candidate.github_url && (
                  <a href={candidate.github_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-[--ag-accent] hover:underline">
                    <Github className="h-3.5 w-3.5" /> GitHub
                  </a>
                )}
                {candidate.portfolio_url && (
                  <a href={candidate.portfolio_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1.5 text-xs font-bold text-[--ag-accent] hover:underline">
                    <Globe className="h-3.5 w-3.5" /> Portfolio
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>

        <div className="grid lg:grid-cols-3 gap-6">
          {/* Left column: Skills + Bio */}
          <div className="space-y-5">

            <VerifiedEvidence skills={skillEvidence} certificates={certificates} />

            <CandidateAnswers answers={answers} />

            {/* Skills */}
            {candidate.skills?.length > 0 && (
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-3">Skills</h2>
                <div className="flex flex-wrap gap-1.5">
                  {candidate.skills.map(s => (
                    <span key={s} className={cn(
                      "text-xs px-2.5 py-1 border font-bold uppercase tracking-wider",
                      goalPath && goalPath.coreSkills?.includes(s)
                        ? "bg-[--ag-accent-dim] border-[--ag-accent]/30 text-[--ag-accent]"
                        : "bg-[--ag-bg] border-[--ag-border] text-[--ag-muted]"
                    )}>
                      {s}
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* About */}
            {candidate.bio && (
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-3">About</h2>
                <p className="text-sm text-[--ag-muted] leading-relaxed">{candidate.bio}</p>
              </div>
            )}
          </div>

          {/* Middle: Experience + Education */}
          <div className="space-y-5">

            {/* Experience */}
            {candidate.experience?.length > 0 && (
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                  <Briefcase className="h-4 w-4 text-[--ag-accent]" /> Experience
                </h2>
                <div className="space-y-4">
                  {candidate.experience.map((e: any, i: number) => (
                    <div key={e.id ?? i} className="border-l-2 border-[--ag-accent]/30 pl-3">
                      <p className="font-bold text-[--ag-text] text-sm">{e.title}</p>
                      <p className="text-xs font-bold text-[--ag-accent]">{e.company}</p>
                      <p className="text-xs text-[--ag-muted] mt-0.5">{expLabel(e)}</p>
                      {e.description && (
                        <p className="text-xs text-[--ag-muted] mt-1 leading-relaxed">{e.description}</p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Education */}
            {candidate.education?.length > 0 && (
              <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
                <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-3 flex items-center gap-2">
                  <GraduationCap className="h-4 w-4 text-[--ag-accent]" /> Education
                </h2>
                <div className="space-y-4">
                  {candidate.education.map((e: any, i: number) => (
                    <div key={e.id ?? i} className="border-l-2 border-[--ag-accent]/30 pl-3">
                      <p className="font-bold text-[--ag-text] text-sm">{e.degree}</p>
                      {e.fieldOfStudy && <p className="text-xs text-[--ag-muted]">{e.fieldOfStudy}</p>}
                      <p className="text-xs font-bold text-[--ag-accent]">{e.institution}</p>
                      <p className="text-xs text-[--ag-muted] mt-0.5">{eduLabel(e)}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Right: Applications + Status management */}
          <div className="bg-[--ag-surface] border border-[--ag-border] p-5">
            <h2 className="font-['Syne'] font-bold text-[--ag-text] text-sm uppercase tracking-wide mb-4 flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-[--ag-accent]" /> Applications
            </h2>

            {applications.length === 0 ? (
              <div className="text-center py-8">
                <p className="text-sm text-[--ag-muted]">No applications to your jobs</p>
              </div>
            ) : (
              <div className="space-y-4">
                {applications.map(app => (
                  <div key={app.id} className="border border-[--ag-border] p-4 bg-[--ag-bg]">
                    <p className="font-bold text-[--ag-text] text-sm mb-1">{app.job?.title ?? "Unknown"}</p>
                    <p className="text-xs text-[--ag-muted] mb-3">{relativeDate(app.applied_at)}</p>

                    {app.cover_note && (
                      <p className="text-xs text-[--ag-muted] italic mb-3 border-l-2 border-[--ag-accent]/30 pl-2">
                        "{app.cover_note}"
                      </p>
                    )}

                    <div className="flex items-center gap-2 mb-3">
                      <span className={cn("text-xs font-bold px-2.5 py-1 border capitalize", STATUS_STYLES[app.status as Status] ?? STATUS_STYLES.applied)}>
                        {app.status}
                      </span>
                    </div>

                    <div className="relative">
                      <select
                        value={app.status}
                        onChange={e => updateStatus(app.id, e.target.value as Status)}
                        disabled={updating === app.id}
                        className="w-full h-9 rounded-none border border-[--ag-border] bg-[--ag-surface] px-3 pr-8 text-xs text-[--ag-text] focus:outline-none focus:border-[--ag-accent] appearance-none disabled:opacity-50"
                      >
                        <option value="" disabled>Move to...</option>
                        {STATUSES.filter(s => s !== app.status).map(s => (
                          <option key={s} value={s}>→ {s.charAt(0).toUpperCase() + s.slice(1)}</option>
                        ))}
                      </select>
                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-[--ag-muted] pointer-events-none" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
