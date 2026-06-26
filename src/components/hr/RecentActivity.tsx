import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  FileText, 
  Calendar, 
  Mail, 
  AlertTriangle, 
  UserCheck,
  Clock
} from "lucide-react";
import { recentActivity } from "@/data/hrMockData";

const activityIcons = {
  application: FileText,
  interview: Calendar,
  offer: Mail,
  review: AlertTriangle,
  hire: UserCheck,
};

const activityColors = {
  application: "text-primary",
  interview: "text-warning",
  offer: "text-success",
  review: "text-danger",
  hire: "text-success",
};

export function RecentActivity() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          Recent Activity
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {recentActivity.map((activity) => {
            const Icon = activityIcons[activity.type as keyof typeof activityIcons];
            const colorClass = activityColors[activity.type as keyof typeof activityColors];
            
            return (
              <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors">
                <div className={`p-2 rounded-lg bg-muted ${colorClass}`}>
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {activity.message}
                  </p>
                  <div className="flex items-center gap-2 mt-1">
                    <p className="text-xs text-muted-foreground">
                      {activity.timestamp}
                    </p>
                    {activity.urgent && (
                      <Badge variant="outline" className="text-xs bg-danger/10 border-danger/20 text-danger">
                        Urgent
                      </Badge>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
          
          <div className="text-center pt-4">
            <button className="text-sm text-primary hover:text-primary-hover font-medium transition-colors">
              View All Activity
            </button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}