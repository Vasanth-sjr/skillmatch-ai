import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Briefcase, Calendar, TrendingUp, UserCheck, Clock } from "lucide-react";

const stats = [
  {
    title: "Total Applicants",
    value: "1,247",
    change: "+12% from last month",
    changeType: "positive" as const,
    icon: Users,
  },
  {
    title: "Active Job Openings",
    value: "23",
    change: "5 new this week",
    changeType: "positive" as const,
    icon: Briefcase,
  },
  {
    title: "Interviews Scheduled",
    value: "48",
    change: "+8% from last week",
    changeType: "positive" as const,
    icon: Calendar,
  },
  {
    title: "Hiring Success Rate",
    value: "73%",
    change: "+5% from last quarter",
    changeType: "positive" as const,
    icon: TrendingUp,
  },
  {
    title: "Candidates Hired",
    value: "156",
    change: "This quarter",
    changeType: "neutral" as const,
    icon: UserCheck,
  },
  {
    title: "Avg. Time to Hire",
    value: "21 days",
    change: "-3 days from last month",
    changeType: "positive" as const,
    icon: Clock,
  },
];

export function DashboardStats() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
      {stats.map((stat, index) => (
        <Card key={stat.title} className="group hover:shadow-card-custom transition-all duration-200 hover:-translate-y-1">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              {stat.title}
            </CardTitle>
            <div className="p-2 rounded-lg bg-primary/10 text-primary group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
              <stat.icon className="h-4 w-4" />
            </div>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">
              {stat.value}
            </div>
            <p className={`text-xs mt-1 ${
              stat.changeType === 'positive' 
                ? 'text-success' 
                : stat.changeType === 'neutral' 
                ? 'text-muted-foreground'
                : 'text-danger'
            }`}>
              {stat.change}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
}