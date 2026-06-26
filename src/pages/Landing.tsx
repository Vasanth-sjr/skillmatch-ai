import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { SkillMatchLogo } from "@/components/SkillMatchLogo";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Briefcase, Sparkles } from "lucide-react";
import { useAuth } from "@/components/AuthProvider";

const Landing = () => {
  const navigate = useNavigate();
  const { user, userRole, loading } = useAuth();

  // Already logged in — send straight to their portal
  useEffect(() => {
    if (!loading && user) {
      navigate(userRole === "employer" ? "/hr/dashboard" : "/dashboard", { replace: true });
    }
  }, [user, userRole, loading, navigate]);

  return (
    <div className="min-h-screen bg-[--ag-bg] flex flex-col">
      {/* Nav */}
      <nav className="border-b border-[--ag-border] px-6 py-4 flex items-center justify-between">
        <SkillMatchLogo size="md" />
        <Button variant="ghost" onClick={() => navigate("/login")} className="text-[--ag-text]">
          Sign In
        </Button>
      </nav>

      {/* Hero */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-16 text-center">
        <div className="flex items-center gap-2 mb-6 px-4 py-1.5 rounded-full border border-[--ag-border] bg-[--ag-surface] text-sm text-[--ag-muted]">
          <Sparkles className="h-4 w-4 text-[--ag-accent]" />
          AI-Powered Skill Matching Platform
        </div>

        <h1 className="font-['Syne'] font-extrabold text-5xl md:text-6xl text-[--ag-text] leading-tight max-w-3xl mb-4">
          Match Skills.<br />
          <span className="text-[--ag-accent]">Accelerate Careers.</span>
        </h1>

        <p className="text-[--ag-muted] text-lg max-w-xl mb-14">
          Whether you're looking for your next opportunity or hiring top talent —
          SkillMatch AI connects the right people to the right roles.
        </p>

        {/* Role cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl">
          {/* Job Seeker */}
          <button
            onClick={() => navigate("/register?role=student")}
            className="group text-left p-8 rounded-2xl border border-[--ag-border] bg-[--ag-surface] hover:border-[--ag-accent] hover:shadow-lg hover:shadow-[--ag-accent]/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[--ag-accent]/10">
                <Users className="h-6 w-6 text-[--ag-accent]" />
              </div>
              <ArrowRight className="h-5 w-5 text-[--ag-muted] group-hover:text-[--ag-accent] group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="font-['Syne'] font-bold text-xl text-[--ag-text] mb-2">
              I'm a Job Seeker
            </h2>
            <p className="text-sm text-[--ag-muted] leading-relaxed">
              Upload your resume, discover your skill gaps, get a personalised
              learning roadmap, and find matched opportunities.
            </p>
            <div className="mt-5 text-xs font-semibold text-[--ag-accent]">
              Get started free →
            </div>
          </button>

          {/* HR */}
          <button
            onClick={() => navigate("/register?role=employer")}
            className="group text-left p-8 rounded-2xl border border-[--ag-border] bg-[--ag-surface] hover:border-[--ag-accent] hover:shadow-lg hover:shadow-[--ag-accent]/10 transition-all duration-200"
          >
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-xl bg-[--ag-accent]/10">
                <Briefcase className="h-6 w-6 text-[--ag-accent]" />
              </div>
              <ArrowRight className="h-5 w-5 text-[--ag-muted] group-hover:text-[--ag-accent] group-hover:translate-x-1 transition-all" />
            </div>
            <h2 className="font-['Syne'] font-bold text-xl text-[--ag-text] mb-2">
              I'm Hiring
            </h2>
            <p className="text-sm text-[--ag-muted] leading-relaxed">
              Post jobs, screen candidates with AI-powered authenticity scoring,
              and manage your full hiring pipeline in one place.
            </p>
            <div className="mt-5 text-xs font-semibold text-[--ag-accent]">
              Access ATS dashboard →
            </div>
          </button>
        </div>

        <p className="mt-10 text-xs text-[--ag-muted]">
          Already have an account?{" "}
          <button onClick={() => navigate("/login")} className="text-[--ag-accent] hover:underline font-medium">
            Sign in
          </button>
        </p>
      </div>

      {/* Footer */}
      <footer className="border-t border-[--ag-border] px-6 py-4 text-center text-xs text-[--ag-muted]">
        © 2026 SkillMatch AI · Bridging skills and opportunity
      </footer>
    </div>
  );
};

export default Landing;
