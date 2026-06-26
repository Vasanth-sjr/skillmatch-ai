import { ArrowRight, Play, CheckCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import heroIllustration from "@/assets/hero-illustration.png";

const floatingCards = [
  { label: "Accuracy", value: "95%", sub: "Hiring match", delay: 0 },
  { label: "Skills", value: "200+", sub: "Analyzed", delay: 0.4 },
];

export function HeroSection() {
  return (
    <section className="relative py-24 md:py-32 overflow-hidden bg-[--ag-bg]">
      <div className="absolute inset-0 geometric-pattern opacity-30" />
      <div className="container mx-auto px-4 relative">
        <div className="grid lg:grid-cols-12 gap-12 items-center">
          {/* Left — 70% text */}
          <div className="lg:col-span-7 space-y-6">
            <div className="inline-flex items-center gap-2 rounded-none bg-[--ag-accent-dim] px-4 py-2 text-sm font-semibold border border-[--ag-accent]/20 text-[--ag-accent]">
              <span className="h-2 w-2 rounded-full bg-[--ag-accent]" />
              COMPETENCY GAP ANALYSIS
            </div>

            <h1 className="text-5xl md:text-7xl font-['Syne'] font-extrabold text-[--ag-text] leading-[1.05] tracking-tight">
              Smart, Skill-Based{" "}
              <span className="text-[--ag-accent]">Recruitment</span>{" "}
              with AI
            </h1>

            <p className="text-lg text-[--ag-muted] max-w-xl leading-relaxed">
              Powered by transformer-based semantic embeddings, vector databases for real-time
              similarity search, RAG for contextual roadmaps, and LLMs for personalized feedback.
            </p>

            <div className="flex flex-wrap gap-4">
              <Link to="/dashboard">
                <Button variant="hero" size="xl" className="gap-2 rounded-none bg-[--ag-accent] text-[#07080F] font-bold uppercase tracking-widest hover:brightness-110">
                  Analyze my profile
                  <ArrowRight className="h-5 w-5" />
                </Button>
              </Link>
              <Button variant="heroOutline" size="xl" className="gap-2 rounded-none border-[--ag-accent] text-[--ag-accent] bg-transparent hover:bg-[--ag-accent-dim]">
                <Play className="h-5 w-5" />
                Request Demo
              </Button>
            </div>

            <div className="flex flex-wrap gap-2 mt-2">
              {["Transformers", "Vector DB", "RAG", "LLMs", "vLLM", "ONNX Runtime"].map((tech) => (
                <span
                  key={tech}
                  className="px-2.5 py-1 rounded-none text-xs font-bold bg-[--ag-accent-dim] text-[--ag-accent] border border-[--ag-accent]/20"
                >
                  {tech}
                </span>
              ))}
            </div>

            {/* Social proof */}
            <div className="flex items-center gap-4 pt-4">
              <div className="flex -space-x-3">
                {["JD", "ES", "ML", "SJ"].map((initials) => (
                  <div
                    key={initials}
                    className="h-10 w-10 rounded-none bg-[--ag-accent] text-[#07080F] flex items-center justify-center text-xs font-bold border-2 border-[--ag-bg]"
                  >
                    {initials}
                  </div>
                ))}
              </div>
              <div>
                <p className="text-sm font-bold text-[--ag-text]">3,500+ candidates matched</p>
                <p className="text-xs text-[--ag-muted]">Join thousands of users</p>
              </div>
            </div>
          </div>

          {/* Right — 30% illustration */}
          <div className="lg:col-span-5 relative">
            <div className="rounded-none overflow-hidden shadow-2xl shadow-[--ag-accent]/10 border border-[--ag-border]">
              <img src={heroIllustration} alt="SkillMatch AI Dashboard" className="w-full grayscale opacity-80" />
            </div>

            {/* Floating cards */}
            {floatingCards.map((card) => (
              <div
                key={card.label}
                className="absolute bg-[--ag-surface] rounded-none p-4 card-shadow-hover border border-[--ag-border] animate-float"
                style={{
                  animationDelay: `${card.delay}s`,
                  ...(card.delay === 0
                    ? { top: "10%", left: "-20%" }
                    : { bottom: "15%", right: "-10%" }),
                }}
              >
                <div className="flex items-center gap-3">
                  <span className="text-2xl font-['JetBrains_Mono'] font-extrabold text-[--ag-accent]">{card.value}</span>
                  <div>
                    <p className="text-sm font-bold text-[--ag-text]">{card.label}</p>
                    <p className="text-xs text-[--ag-muted]">{card.sub}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
