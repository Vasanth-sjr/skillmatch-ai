import { TrendingUp, Users, Award, Target } from "lucide-react";

const stats = [
  { label: "CANDIDATES MATCHED", value: "3,500+", icon: Users },
  { label: "HIRING ACCURACY", value: "95%", icon: Target },
  { label: "SKILLS ANALYZED", value: "200+", icon: Award },
  { label: "GROWTH RATE", value: "4.8x", icon: TrendingUp },
];

export function StatsSection() {
  return (
    <section className="py-16 bg-[--ag-bg] border-t border-[--ag-border]">
      <div className="container mx-auto px-4">
        <div className="border-t-4 border-t-[--ag-accent] rounded-none bg-[--ag-surface] border-[--ag-border] border-[1px] p-8 card-shadow">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {stats.map((stat) => (
              <div key={stat.label} className="text-center">
                <p className="text-4xl md:text-5xl font-['JetBrains_Mono'] font-extrabold text-[--ag-accent] tracking-tight">{stat.value}</p>
                <p className="text-xs font-bold uppercase tracking-wider text-[--ag-muted] mt-2">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
