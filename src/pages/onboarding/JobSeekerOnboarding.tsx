import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/components/AuthProvider";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CareerQuiz } from "@/components/onboarding/CareerQuiz";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { ArrowRight, CheckCircle } from "lucide-react";

const CAREER_STATUSES = [
  { key: "student",         label: "Student",               sub: "Currently enrolled in college or university" },
  { key: "fresh_grad",      label: "Fresh Graduate",        sub: "Graduated within the last year" },
  { key: "professional",    label: "Working Professional",  sub: "Currently employed, looking to grow or switch" },
  { key: "career_changer",  label: "Career Changer",        sub: "Transitioning into tech from another field" },
];

type Stage = "status" | "path_choice" | "role_picker" | "quiz";

export default function JobSeekerOnboarding() {
  const { user, refreshProfile } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const [stage, setStage]           = useState<Stage>("status");
  const [careerStatus, setCareerStatus] = useState("");
  const [saving, setSaving]         = useState(false);

  const handleSave = async (careerGoal: CareerPathKey) => {
    if (!user) return;
    setSaving(true);

    const { error } = await (supabase as any)
      .from("profiles")
      .upsert({
        id: user.id,
        email: user.email,
        full_name: user.user_metadata?.full_name ?? null,
        role: "student",
        career_goal: careerGoal,
        career_status: careerStatus,
        updated_at: new Date().toISOString(),
      }, { onConflict: "id" });

    if (error) {
      toast({ title: "Save failed", description: error.message, variant: "destructive" });
    } else {
      await refreshProfile();
      const path = CAREER_PATHS[careerGoal];
      toast({ title: `You're set up as ${path.label}!`, description: "Your roadmap is ready on the dashboard." });
      navigate("/dashboard", { replace: true });
    }
    setSaving(false);
  };

  const leftCopy = {
    status:       { heading: "Let's set you up.", body: "This takes 2 minutes. We'll personalise your experience and generate your career roadmap immediately." },
    path_choice:  { heading: "Know your direction?", body: "If you're sure, pick your role. If not — that's what our quiz is for. No judgement here." },
    role_picker:  { heading: "Pick your path.", body: "Choose the career you're aiming for. You can always change this later from your profile." },
    quiz:         { heading: "Find your path.", body: "Answer 6 questions honestly. Our AI will match you to the career that fits how you think, not just what you know." },
  };

  const { heading, body } = leftCopy[stage];

  return (
    <div className="min-h-screen bg-[--ag-bg] flex">
      {/* ── Left panel ── */}
      <div className="hidden lg:flex lg:w-5/12 bg-[--ag-surface] border-r border-[--ag-border] flex-col justify-between p-12">
        <SkillMatchLogo size="md" />
        <div className="space-y-6">
          <p className="text-xs font-bold uppercase tracking-widest text-[--ag-accent]">Job Seeker Setup</p>
          <h2 className="text-4xl font-['Syne'] font-extrabold text-[--ag-text] leading-tight">{heading}</h2>
          <p className="text-[--ag-muted] leading-relaxed">{body}</p>

          {stage !== "quiz" && (
            <div className="space-y-3 pt-4 border-t border-[--ag-border]">
              {["AI-generated career roadmap", "Personalised job matches", "Skill gap analysis"].map(f => (
                <div key={f} className="flex items-center gap-3">
                  <CheckCircle className="h-4 w-4 text-[--ag-accent] shrink-0" />
                  <span className="text-sm text-[--ag-muted]">{f}</span>
                </div>
              ))}
            </div>
          )}
        </div>
        <p className="text-xs text-[--ag-muted]">© 2026 SkillMatch AI</p>
      </div>

      {/* ── Right panel ── */}
      <div className="flex-1 flex items-center justify-center p-8 overflow-y-auto">
        <div className="w-full max-w-lg py-8">

          {/* ── Stage: status ── */}
          {stage === "status" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[--ag-accent] mb-1">Step 1 of 2</p>
                <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text]">What best describes you?</h1>
              </div>

              <div className="space-y-3">
                {CAREER_STATUSES.map(s => (
                  <button
                    key={s.key}
                    onClick={() => setCareerStatus(s.key)}
                    className={`w-full text-left p-4 border transition-all ${
                      careerStatus === s.key
                        ? "border-[--ag-accent] bg-[--ag-accent-dim]"
                        : "border-[--ag-border] bg-[--ag-surface] hover:border-[--ag-accent]/50"
                    }`}
                  >
                    <p className="font-bold text-[--ag-text]">{s.label}</p>
                    <p className="text-sm text-[--ag-muted]">{s.sub}</p>
                  </button>
                ))}
              </div>

              <div className="flex justify-end">
                <Button
                  onClick={() => setStage("path_choice")}
                  disabled={!careerStatus}
                  className="gap-2 rounded-none bg-[--ag-accent] text-white font-bold uppercase tracking-widest hover:brightness-110 disabled:opacity-40"
                >
                  Continue <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          )}

          {/* ── Stage: path_choice ── */}
          {stage === "path_choice" && (
            <div className="space-y-6">
              <div>
                <p className="text-xs font-bold uppercase tracking-widest text-[--ag-accent] mb-1">Step 2 of 2</p>
                <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text]">Do you know your career path?</h1>
                <p className="text-sm text-[--ag-muted] mt-2">Be honest — it's completely okay not to know. That's what we're here for.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <button
                  onClick={() => setStage("role_picker")}
                  className="p-6 border border-[--ag-border] bg-[--ag-surface] hover:border-[--ag-accent] hover:bg-[--ag-accent-dim] transition-all text-left"
                >
                  <div className="text-4xl mb-4">🎯</div>
                  <p className="font-bold text-[--ag-text] text-lg">Yes, I know</p>
                  <p className="text-sm text-[--ag-muted] mt-1">I have a clear role in mind — let me pick it</p>
                </button>
                <button
                  onClick={() => setStage("quiz")}
                  className="p-6 border-2 border-[--ag-accent] bg-[--ag-accent-dim] hover:brightness-95 transition-all text-left"
                >
                  <div className="text-4xl mb-4">🔍</div>
                  <p className="font-bold text-[--ag-text] text-lg">I'm exploring</p>
                  <p className="text-sm text-[--ag-muted] mt-1">Help me find the right path with our 6-question quiz</p>
                </button>
              </div>

              <button
                onClick={() => setStage("status")}
                className="text-sm text-[--ag-muted] hover:text-[--ag-text] transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Stage: role_picker ── */}
          {stage === "role_picker" && (
            <div className="space-y-6">
              <div>
                <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text]">Pick your career path</h1>
                <p className="text-sm text-[--ag-muted] mt-2">You can always change this later from your profile.</p>
              </div>

              <div className="grid grid-cols-2 gap-3">
                {Object.values(CAREER_PATHS).map(path => (
                  <button
                    key={path.key}
                    onClick={() => handleSave(path.key)}
                    disabled={saving}
                    className="p-4 border border-[--ag-border] bg-[--ag-surface] hover:border-[--ag-accent] hover:bg-[--ag-accent-dim] transition-all text-left disabled:opacity-50 disabled:cursor-wait"
                  >
                    <div className="text-2xl mb-2">{path.emoji}</div>
                    <p className="font-bold text-[--ag-text] text-sm leading-tight">{path.label}</p>
                    <p className="text-xs text-[--ag-muted] mt-1 leading-snug">{path.tagline}</p>
                    <div className="mt-2 flex items-center gap-1">
                      <span className={`text-xs font-semibold px-1.5 py-0.5 ${
                        path.demandLevel === "Explosive" ? "bg-green-100 text-green-700" :
                        path.demandLevel === "Very High" ? "bg-blue-100 text-blue-700" :
                        "bg-gray-100 text-gray-600"
                      }`}>
                        {path.demandLevel}
                      </span>
                      <span className="text-xs text-[--ag-muted]">{path.salaryRange}</span>
                    </div>
                  </button>
                ))}
              </div>

              <button
                onClick={() => setStage("path_choice")}
                className="text-sm text-[--ag-muted] hover:text-[--ag-text] transition-colors"
              >
                ← Back
              </button>
            </div>
          )}

          {/* ── Stage: quiz ── */}
          {stage === "quiz" && (
            <CareerQuiz
              onComplete={handleSave}
              onBack={() => setStage("path_choice")}
            />
          )}
        </div>
      </div>
    </div>
  );
}
