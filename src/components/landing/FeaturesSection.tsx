import { Sparkles, Shield, Zap, BarChart3, Users, Brain } from "lucide-react";
import { cn } from "@/lib/utils";

const features = [
  {
    title: "Competency gap analysis",
    description: "Transformer-based semantic embeddings (all-MiniLM-L6-v2, 384d) analyze skills from resumes and match candidates via vector cosine similarity in Pinecone.",
    icon: Brain,
    color: "primary",
    isHero: true,
    tech: "Transformer Embeddings + Pinecone",
  },
  {
    title: "Real-Time Skill Analysis",
    description: "Extract 200+ skills via NLP entity recognition. Dense embeddings are generated in <15ms using ONNX Runtime with INT8 quantization.",
    icon: Zap,
    color: "orange",
    tech: "ONNX Runtime + vLLM",
  },
  {
    title: "Integrity Monitoring",
    description: "Plagiarism detection via document embedding similarity search. Engagement scoring through behavioral pattern analysis with anomaly detection.",
    icon: Shield,
    color: "green",
    tech: "Vector Similarity Search",
  },
  {
    title: "Analytics Dashboard",
    description: "RAG-powered insights pipeline retrieves context from skill gaps and generates actionable reports via GPT-4o-mini and LangChain RetrievalQA.",
    icon: BarChart3,
    color: "purple",
    tech: "RAG + LangChain",
  },
  {
    title: "Multi-User Platform",
    description: "Role-specific dashboards for students, employers, and recruiters with personalized AI-driven experiences and real-time inference.",
    icon: Users,
    color: "cyan",
    tech: "Continuous Batching",
  },
  {
    title: "Smart Recommendations",
    description: "LLM-generated course and career recommendations using Retrieval-Augmented Generation based on individual skill vectors and market demand embeddings.",
    icon: Sparkles,
    color: "primary",
    tech: "LLM + RAG Pipeline",
  },
];

const iconColors = {
  primary: "bg-primary/10 text-primary",
  orange: "bg-metric-orange/10 text-metric-orange",
  green: "bg-metric-green/10 text-metric-green",
  purple: "bg-metric-purple/10 text-metric-purple",
  cyan: "bg-metric-cyan/10 text-metric-cyan",
};

const borderColors = {
  primary: "border-l-primary",
  orange: "border-l-metric-orange",
  green: "border-l-metric-green",
  purple: "border-l-metric-purple",
  cyan: "border-l-metric-cyan",
};

export function FeaturesSection() {
  return (
    <section className="py-24 bg-[--ag-bg]">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <span className="inline-flex items-center gap-2 rounded-none bg-[--ag-surface] text-[--ag-muted] px-4 py-2 text-sm font-bold border border-[--ag-border] mb-4">
            WHAT SKILLMATCH SURFACES
          </span>
          <h2 className="text-4xl md:text-5xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight mb-4">
            What SkillMatch surfaces
          </h2>
          <p className="text-lg text-[--ag-muted] max-w-2xl mx-auto">
            Our platform combines cutting-edge AI technology with intuitive design to revolutionize
            how talent meets opportunity.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((feature, index) => (
            <div
              key={feature.title}
              className={cn(
                "group rounded-none bg-[--ag-surface] border border-[--ag-border] p-6 hover:shadow-[0_4px_20px_-5px_rgba(0,216,255,0.1)] transition-all duration-300",
                "border-t-4 border-t-[--ag-accent]",
                feature.isHero && "md:col-span-2 lg:col-span-2"
              )}
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className={cn("p-3 inline-flex mb-4 bg-[--ag-accent-dim] text-[--ag-accent]")}>
                <feature.icon className={cn("h-6 w-6", feature.isHero && "h-8 w-8")} />
              </div>
              <h3 className={cn("font-bold text-[--ag-text] mb-2", feature.isHero ? "text-2xl font-['Syne']" : "text-lg")}>
                {feature.title}
              </h3>
              <p className={cn("text-[--ag-muted]", feature.isHero ? "text-base" : "text-sm")}>
                {feature.description}
              </p>
              {feature.tech && (
                <span className="inline-block mt-3 px-2 py-0.5 rounded-none text-[10px] font-bold uppercase tracking-wider bg-[--ag-bg] border border-[--ag-border] text-[--ag-muted]">
                  {feature.tech}
                </span>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
