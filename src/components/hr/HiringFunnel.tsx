import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingDown } from "lucide-react";
import { hiringFunnelData } from "@/data/hrMockData";

export function HiringFunnel() {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <TrendingDown className="h-5 w-5" />
          Hiring Funnel
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {hiringFunnelData.map((stage, index) => {
            const width = stage.percentage;
            const isFirst = index === 0;
            const isLast = index === hiringFunnelData.length - 1;
            
            return (
              <div key={stage.stage} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-foreground">
                    {stage.stage}
                  </span>
                  <div className="flex items-center gap-2">
                    <span className="text-sm font-bold text-foreground">
                      {stage.count}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      ({stage.percentage}%)
                    </span>
                  </div>
                </div>
                
                <div className="w-full bg-muted rounded-full h-3 overflow-hidden">
                  <div 
                    className={`h-full transition-all duration-500 ${
                      isFirst 
                        ? 'bg-gradient-primary' 
                        : isLast 
                        ? 'bg-gradient-success'
                        : 'bg-primary'
                    }`}
                    style={{ width: `${width}%` }}
                  />
                </div>
                
                {index < hiringFunnelData.length - 1 && (
                  <div className="flex justify-end">
                    <div className="text-xs text-muted-foreground">
                      Drop-off: {hiringFunnelData[index].count - hiringFunnelData[index + 1].count} candidates
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        
        <div className="mt-6 p-4 bg-success-light rounded-lg">
          <div className="flex items-center justify-between">
            <span className="text-sm font-medium text-success">
              Overall Conversion Rate
            </span>
            <span className="text-lg font-bold text-success">
              5.0%
            </span>
          </div>
          <p className="text-xs text-success/70 mt-1">
            +0.8% improvement from last quarter
          </p>
        </div>
      </CardContent>
    </Card>
  );
}