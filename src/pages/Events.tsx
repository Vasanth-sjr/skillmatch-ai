import { useState, useEffect } from "react";
import { DashboardSidebar } from "@/components/dashboard/DashboardSidebar";
import { DashboardHeader } from "@/components/dashboard/DashboardHeader";
import { useAuth } from "@/components/AuthProvider";
import { supabase } from "@/integrations/supabase/client";
import { LEARNING_RESOURCES, LearningResource, ResourceType } from "@/data/learningResources";
import { CAREER_PATHS, CareerPathKey } from "@/data/careerPaths";
import { cn } from "@/lib/utils";
import {
  GraduationCap, Youtube, Users, Code2, Wrench, BookOpen, ExternalLink,
} from "lucide-react";

const TYPE_ICONS: Record<ResourceType, typeof BookOpen> = {
  Course:    GraduationCap,
  YouTube:   Youtube,
  Community: Users,
  Practice:  Code2,
  Book:      BookOpen,
  Tool:      Wrench,
};

const TYPE_STYLES: Record<ResourceType, string> = {
  Course:    "bg-[--ag-accent-dim] text-[--ag-accent] border-[--ag-accent]/30",
  YouTube:   "bg-red-950/30 text-red-400 border-red-900/30",
  Community: "bg-purple-950/30 text-purple-400 border-purple-900/30",
  Practice:  "bg-[--ag-success]/10 text-[--ag-success] border-[--ag-success]/20",
  Book:      "bg-amber-950/30 text-amber-400 border-amber-900/30",
  Tool:      "bg-[--ag-muted]/10 text-[--ag-muted] border-[--ag-border]",
};

function ResourceCard({ r, onOpen }: { r: LearningResource; onOpen: (r: LearningResource) => void }) {
  const Icon = TYPE_ICONS[r.type];
  return (
    <div className="rounded-none bg-[--ag-surface] border border-[--ag-border] p-5 flex flex-col gap-3 hover:shadow-[0_4px_20px_-5px_rgba(0,216,255,0.12)] hover:border-[--ag-accent]/40 transition-all duration-200">
      {/* Badges */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <span className={cn("flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border", TYPE_STYLES[r.type])}>
            <Icon className="h-3 w-3" /> {r.type}
          </span>
          <span
            className={cn(
              "px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider border",
              r.free
                ? "bg-[--ag-success]/10 text-[--ag-success] border-[--ag-success]/20"
                : "bg-[--ag-bg] text-[--ag-muted] border-[--ag-border]",
            )}
          >
            {r.free ? "Free" : "Paid"}
          </span>
        </div>
        <span className="text-[10px] text-[--ag-muted] font-['JetBrains_Mono']">{r.level}</span>
      </div>

      {/* Title + platform */}
      <div>
        <h3 className="text-sm font-extrabold text-[--ag-text] leading-snug">{r.title}</h3>
        <p className="text-[10px] text-[--ag-muted] font-['JetBrains_Mono'] mt-0.5">{r.platform}</p>
      </div>

      {/* Description */}
      <p className="text-xs text-[--ag-muted] leading-relaxed flex-1">{r.description}</p>

      {/* Tags */}
      <div className="flex flex-wrap gap-1.5">
        {r.tags.slice(0, 4).map(tag => (
          <span key={tag} className="px-1.5 py-0.5 text-[10px] text-[--ag-muted] bg-[--ag-bg] border border-[--ag-border]">
            {tag}
          </span>
        ))}
      </div>

      {/* Link */}
      <a
        href={r.url}
        target="_blank"
        rel="noopener noreferrer"
        onClick={() => onOpen(r)}
        className="flex items-center justify-center gap-2 py-2 text-xs font-bold uppercase tracking-wider bg-[--ag-accent-dim] text-[--ag-accent] border border-[--ag-accent]/30 hover:bg-[--ag-accent]/20 transition-colors"
      >
        Open Resource <ExternalLink className="h-3.5 w-3.5" />
      </a>
    </div>
  );
}

const ALL_FILTERS: (ResourceType | "All")[] = [
  "All", "Course", "YouTube", "Practice", "Community", "Tool", "Book",
];

const Events = () => {
  const { user, profile } = useAuth();
  const [selectedPath, setSelectedPath] = useState<CareerPathKey>(
    (profile?.career_goal as CareerPathKey) || "frontend_dev",
  );
  const [typeFilter, setTypeFilter] = useState<ResourceType | "All">("All");

  useEffect(() => {
    if (profile?.career_goal) {
      setSelectedPath(profile.career_goal as CareerPathKey);
    }
  }, [profile?.career_goal]);

  // Fire-and-forget: records engagement for AMSCE's Learning Activity
  // Analyzer. Doesn't block the resource opening in its new tab.
  const logEngagement = (r: LearningResource) => {
    if (!user) return;
    (supabase as any).from("learning_resource_engagement").insert({
      user_id: user.id,
      resource_id: r.id,
      career_path: selectedPath,
      skill_tags: r.tags,
      engaged_at: new Date().toISOString(),
    });
  };

  const resources = LEARNING_RESOURCES[selectedPath] || [];
  const filtered  = typeFilter === "All" ? resources : resources.filter(r => r.type === typeFilter);
  const freeCount = resources.filter(r => r.free).length;
  const pathInfo  = CAREER_PATHS[selectedPath];

  return (
    <div className="min-h-screen bg-[--ag-bg]">
      <DashboardSidebar />
      <div className="pl-64 min-h-screen transition-all duration-300">
        <DashboardHeader />
        <main className="p-6 space-y-6">

          {/* Header */}
          <div>
            <h1 className="text-3xl font-['Syne'] font-extrabold text-[--ag-text] tracking-tight flex items-center gap-3">
              <GraduationCap className="h-8 w-8 text-[--ag-accent]" />
              Learning Resources
            </h1>
            <p className="text-sm text-[--ag-muted] mt-1">
              Curated, high-quality resources per career path ·{" "}
              <span className="text-[--ag-success] font-bold">{freeCount}</span>/{resources.length} free
            </p>
          </div>

          {/* Controls */}
          <div className="flex items-center gap-4 flex-wrap">
            <div className="flex items-center gap-2">
              <label className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">Path</label>
              <select
                value={selectedPath}
                onChange={e => setSelectedPath(e.target.value as CareerPathKey)}
                className="bg-[--ag-surface] border border-[--ag-border] text-[--ag-text] text-sm px-3 py-1.5 focus:outline-none focus:border-[--ag-accent] cursor-pointer"
              >
                {Object.entries(CAREER_PATHS).map(([key, path]) => (
                  <option key={key} value={key}>{path.emoji} {path.label}</option>
                ))}
              </select>
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              {ALL_FILTERS.map(f => (
                <button
                  key={f}
                  onClick={() => setTypeFilter(f)}
                  className={cn(
                    "px-3 py-1.5 text-xs font-bold uppercase tracking-wider border transition-all",
                    typeFilter === f
                      ? "bg-[--ag-accent] text-[#07080F] border-[--ag-accent]"
                      : "bg-[--ag-surface] border-[--ag-border] text-[--ag-muted] hover:border-[--ag-accent]/40",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Section label */}
          <div className="flex items-center gap-2">
            <span className="text-base font-['Syne'] font-bold text-[--ag-text]">
              {pathInfo.emoji} {pathInfo.label}
            </span>
            <span className="text-[--ag-muted]">·</span>
            <span className="text-xs text-[--ag-muted]">{filtered.length} resources</span>
          </div>

          {/* Grid */}
          {filtered.length > 0 ? (
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-4">
              {filtered.map(r => <ResourceCard key={r.id} r={r} onOpen={logEngagement} />)}
            </div>
          ) : (
            <div className="text-center py-16 text-[--ag-muted]">
              <p className="text-sm">No resources match this filter.</p>
            </div>
          )}
        </main>
      </div>
    </div>
  );
};

export default Events;
