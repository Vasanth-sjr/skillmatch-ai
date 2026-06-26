import { AlertTriangle, Activity, FileWarning, X, Check } from "lucide-react";
import { cn } from "@/lib/utils";
import { useState } from "react";
import { useToast } from "@/hooks/use-toast";

interface Alert {
  id: number;
  type: "warning" | "error";
  message: string;
  icon: typeof Activity;
  timestamp: string;
}

const initialAlerts: Alert[] = [
  {
    id: 1,
    type: "warning",
    message: "Low engagement in last assessment",
    icon: Activity,
    timestamp: "2 hours ago",
  },
  {
    id: 2,
    type: "error",
    message: "Plagiarism risk detected in assignment",
    icon: FileWarning,
    timestamp: "5 hours ago",
  },
  {
    id: 3,
    type: "warning",
    message: "Skill mismatch between resume and assessments",
    icon: AlertTriangle,
    timestamp: "1 day ago",
  },
];

const alertStyles = {
  warning: "bg-metric-orange/10 border-l-metric-orange text-metric-orange",
  error: "bg-destructive/10 border-l-destructive text-destructive",
};

export function IntegrityAlerts() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const { toast } = useToast();

  const dismissAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Alert dismissed", description: "The alert has been resolved." });
  };

  const resolveAlert = (id: number) => {
    setAlerts((prev) => prev.filter((a) => a.id !== id));
    toast({ title: "Alert resolved", description: "Marked as resolved." });
  };

  return (
    <div className="rounded-xl bg-card p-5 card-shadow border border-border">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Learning Integrity Alerts
        </h3>
        <span className="text-xs px-2.5 py-1 rounded-full bg-destructive/10 text-destructive font-bold">
          {alerts.length} alert{alerts.length !== 1 ? "s" : ""}
        </span>
      </div>

      {alerts.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-8 text-center">
          <div className="p-3 rounded-full bg-metric-green/10 mb-3">
            <Check className="h-6 w-6 text-metric-green" />
          </div>
          <p className="text-sm font-bold text-foreground">All clear!</p>
          <p className="text-xs text-muted-foreground mt-1">No integrity issues found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <div
              key={alert.id}
              className={cn(
                "flex items-center gap-3 p-3 rounded-lg border-l-4 group",
                alertStyles[alert.type]
              )}
            >
              <alert.icon className="h-4 w-4 shrink-0" />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold">{alert.message}</p>
                <p className="text-xs opacity-70 mt-0.5">{alert.timestamp}</p>
              </div>
              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button
                  onClick={() => resolveAlert(alert.id)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  title="Resolve"
                >
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => dismissAlert(alert.id)}
                  className="p-1 rounded hover:bg-white/20 transition-colors"
                  title="Dismiss"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
