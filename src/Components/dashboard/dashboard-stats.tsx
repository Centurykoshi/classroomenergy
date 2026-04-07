import { Activity, AlertTriangle, Lightbulb, Lock } from "lucide-react";
import { Card, CardContent } from "@/Components/ui/card";

interface DashboardStatsProps {
  total: number;
  onCount: number;
  lockedCount: number;
  activity?: {
    day: { on: number; off: number };
    week: { on: number; off: number };
    month: { on: number; off: number };
  };
}

export function DashboardStats({ total, onCount, lockedCount, activity }: DashboardStatsProps) {
  const offCount = Math.max(total - onCount, 0);

  return (
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 xl:grid-cols-4">
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/5">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Classrooms</p>
              <p className="text-2xl font-semibold">{total}</p>
            </div>
            <Activity className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-primary/30 bg-gradient-to-br from-card to-primary/12">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lights ON</p>
              <p className="text-2xl font-semibold">{onCount}</p>
            </div>
            <Lightbulb className="h-5 w-5 text-primary" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-secondary/90 bg-gradient-to-br from-card to-secondary/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Lights OFF</p>
              <p className="text-2xl font-semibold">{offCount}</p>
            </div>
            <Lock className="h-5 w-5 text-secondary-foreground" />
          </div>
        </CardContent>
      </Card>
      <Card className="border-accent/80 bg-gradient-to-br from-card to-accent/60">
        <CardContent className="pt-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Activity</p>
              <p className="text-xs text-muted-foreground">
                Today: {activity?.day.on ?? 0} ON / {activity?.day.off ?? 0} OFF
              </p>
              <p className="text-xs text-muted-foreground">
                7d: {activity?.week.on ?? 0} ON / {activity?.week.off ?? 0} OFF
              </p>
              <p className="text-xs text-muted-foreground">
                30d: {activity?.month.on ?? 0} ON / {activity?.month.off ?? 0} OFF
              </p>
              <p className="mt-2 text-xs text-muted-foreground">Active locks: {lockedCount}</p>
            </div>
            <AlertTriangle className="h-5 w-5 text-accent-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
