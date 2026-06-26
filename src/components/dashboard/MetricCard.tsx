import { cn } from "@/lib/utils";
import { LucideIcon } from "lucide-react";

interface MetricCardProps {
  title: string;
  value: string | number;
  note: string;
  icon: LucideIcon;
  trend?: "up" | "down" | "neutral";
  color?: "blue" | "green" | "orange" | "purple" | "cyan";
  index?: number;
}

const colorClasses = {
  blue: "bg-primary/10 text-primary",
  green: "bg-metric-green/10 text-metric-green",
  orange: "bg-metric-orange/10 text-metric-orange",
  purple: "bg-metric-purple/10 text-metric-purple",
  cyan: "bg-metric-cyan/10 text-metric-cyan",
};

const borderColors = {
  blue: "border-l-primary",
  green: "border-l-metric-green",
  orange: "border-l-metric-orange",
  purple: "border-l-metric-purple",
  cyan: "border-l-metric-cyan",
};

export function MetricCard({
  title,
  value,
  note,
  icon: Icon,
  color = "blue",
  index = 0,
}: MetricCardProps) {
  return (
    <div
      className={cn(
        "group relative overflow-hidden rounded-none bg-[--ag-surface] p-5 border border-[--ag-border] hover:shadow-[0_4px_20px_-5px_rgba(0,216,255,0.1)]",
        "border-t-4 transition-all duration-300",
        borderColors[color]
      )}
      style={{ animationDelay: `${index * 0.08}s` }}
    >
      <div className="flex items-start justify-between">
        <div className="space-y-1.5">
          <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted]">
            {title}
          </p>
          <p className="text-3xl font-['JetBrains_Mono'] font-extrabold text-[--ag-accent] tracking-tight">{value}</p>
          <p className="text-xs text-[--ag-muted]">{note}</p>
        </div>
        <div className={cn("p-3 rounded-none bg-[--ag-accent-dim] text-[--ag-accent]")}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
