import { BookOpen, Target, Briefcase, ClipboardCheck, Award } from "lucide-react";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { useState } from "react";

const categories = [
  { name: "Courses", icon: BookOpen, count: 24, href: "/events" },
  { name: "Skill Tracks", icon: Target, count: 8, href: "/events" },
  { name: "Internships", icon: Briefcase, count: 15, href: "/careers" },
  { name: "Assessments", icon: ClipboardCheck, count: 12, href: "/events" },
  { name: "Certifications", icon: Award, count: 6, href: "/profile" },
];

export function QuickSearchPanel() {
  const navigate = useNavigate();
  const [activeCategory, setActiveCategory] = useState<string | null>(null);

  const handleClick = (category: (typeof categories)[0]) => {
    setActiveCategory(category.name);
    setTimeout(() => {
      navigate(category.href);
    }, 200);
  };

  return (
    <div className="rounded-xl bg-card p-5 card-shadow border border-border">
      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mb-4">
        Quick Search
      </h3>
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {categories.map((category) => (
          <button
            key={category.name}
            onClick={() => handleClick(category)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border",
              "transition-all duration-200 group",
              activeCategory === category.name
                ? "border-primary bg-primary/5 border-b-2 border-b-primary scale-95"
                : "border-border bg-background hover:bg-accent hover:border-primary/20"
            )}
          >
            <div
              className={cn(
                "p-2.5 rounded-lg transition-colors",
                activeCategory === category.name
                  ? "bg-primary/10"
                  : "bg-accent group-hover:bg-primary/10"
              )}
            >
              <category.icon className="h-5 w-5 text-primary" />
            </div>
            <span className="text-sm font-semibold text-foreground">{category.name}</span>
            <span className="text-xs text-muted-foreground">{category.count} available</span>
          </button>
        ))}
      </div>
    </div>
  );
}
