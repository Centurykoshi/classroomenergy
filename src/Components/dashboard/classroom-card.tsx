"use client";

import { motion } from "framer-motion";
import { Activity, AlertTriangle, History, Lightbulb, Power, ShieldOff, Trash2 } from "lucide-react";
import { Button } from "@/Components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { ActivityLog, Classroom } from "@/Components/dashboard/types";

interface ClassroomCardProps {
  classroom: Classroom;
  index: number;
  lockRemainingMs: number;
  isToggling: boolean;
  isDeleting: boolean;
  deleteConfirmOpen: boolean;
  onToggle: (classroomId: string, currentState: boolean) => void;
  onForceOff: (classroomId: string) => void;
  onDeleteClick: (classroomId: string) => void;
  onDeleteCancel: () => void;
  onDeleteConfirm: (classroomId: string) => void;
}

function getActionStyle(action: string): string {
  if (action === "ON") return "bg-primary/15 text-primary";
  if (action === "MOTION_BLOCKED") return "bg-accent text-accent-foreground";
  if (action === "FORCE_OFF") return "bg-secondary text-secondary-foreground";
  return "bg-destructive/15 text-destructive";
}

function formatRelativeTime(createdAt: string): string {
  const diffMs = Date.now() - new Date(createdAt).getTime();
  if (diffMs < 60000) return `${Math.max(1, Math.floor(diffMs / 1000))}s ago`;
  if (diffMs < 3600000) return `${Math.floor(diffMs / 60000)}m ago`;
  return `${Math.floor(diffMs / 3600000)}h ago`;
}

function actionIcon(action: string) {
  if (action === "MOTION_BLOCKED") return <AlertTriangle className="h-3.5 w-3.5" />;
  if (action === "FORCE_OFF") return <ShieldOff className="h-3.5 w-3.5" />;
  return <Activity className="h-3.5 w-3.5" />;
}

export function ClassroomCard({
  classroom,
  index,
  lockRemainingMs,
  isToggling,
  isDeleting,
  deleteConfirmOpen,
  onToggle,
  onForceOff,
  onDeleteClick,
  onDeleteCancel,
  onDeleteConfirm,
}: ClassroomCardProps) {
  const lockSeconds = Math.ceil(lockRemainingMs / 1000);
  const lockActive = lockRemainingMs > 0;

  return (
    <motion.div
      key={classroom.id}
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay: index * 0.06 }}
      className="group"
    >
      <Card
        className={`relative overflow-hidden border transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
          classroom.isLightOn
            ? "border-primary/50 shadow-primary/20"
            : "border-border/70"
        } ${lockActive ? "ring-2 ring-primary/30" : ""}`}
      >
        <div className="pointer-events-none absolute inset-0 opacity-50 [background:radial-gradient(circle_at_top_right,color-mix(in_oklab,var(--foreground)_14%,transparent),transparent_50%)]" />
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <CardTitle className="flex items-center gap-2">
              <Lightbulb
                className={`h-5 w-5 transition-all ${
                  classroom.isLightOn ? "fill-primary text-primary" : "text-muted-foreground"
                }`}
              />
              <span>{classroom.name}</span>
            </CardTitle>
            <span
              className={`rounded-full px-2 py-1 text-xs font-semibold ${
                classroom.isLightOn
                  ? "bg-primary/15 text-primary"
                  : "bg-muted text-muted-foreground"
              }`}
            >
              {classroom.isLightOn ? "ON" : "OFF"}
            </span>
          </div>
          <CardDescription>{classroom.description || "No description"}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between text-sm text-muted-foreground">
              <span>Pin: {classroom.arduinoPin ?? "Not Set"}</span>
              {lockActive ? (
                <span className="rounded-full bg-secondary px-2 py-1 text-xs font-semibold text-secondary-foreground">
                  Manual lock: {lockSeconds}s
                </span>
              ) : null}
            </div>

            <Button
              onClick={() => onToggle(classroom.id, classroom.isLightOn)}
              disabled={isToggling}
              className={`w-full ${classroom.isLightOn ? "bg-foreground hover:bg-foreground/90" : "bg-primary hover:bg-primary/85"}`}
            >
              <Power className="mr-2 h-4 w-4" />
              {isToggling ? "Processing..." : classroom.isLightOn ? "Turn OFF" : "Turn ON"}
            </Button>

            {classroom.isLightOn ? (
              <Button
                onClick={() => onForceOff(classroom.id)}
                disabled={isToggling}
                variant="destructive"
                className="w-full"
              >
                <Power className="mr-2 h-4 w-4" />
                {isToggling ? "Processing..." : "Force OFF"}
              </Button>
            ) : null}

            <Button
              onClick={() => onDeleteClick(classroom.id)}
              disabled={isDeleting}
              variant="destructive"
              className="w-full"
            >
              <Trash2 className="mr-2 h-4 w-4" />
              {isDeleting ? "Deleting..." : "Delete Classroom"}
            </Button>

            {deleteConfirmOpen ? (
              <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 px-4">
                <Card className="w-full max-w-md">
                  <CardHeader>
                    <CardTitle>Delete Classroom?</CardTitle>
                    <CardDescription>
                      Are you sure you want to delete &quot;{classroom.name}&quot;? This action cannot be undone.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="flex justify-end gap-3">
                    <Button variant="outline" onClick={onDeleteCancel} disabled={isDeleting}>Cancel</Button>
                    <Button variant="destructive" onClick={() => onDeleteConfirm(classroom.id)} disabled={isDeleting}>
                      {isDeleting ? "Deleting..." : "Delete"}
                    </Button>
                  </CardContent>
                </Card>
              </div>
            ) : null}

            <div className="mt-2 border-t pt-4">
              <h4 className="mb-3 flex items-center gap-2 text-sm font-semibold">
                <History className="h-4 w-4" />
                Activity History
              </h4>
              {classroom.activityLogs && classroom.activityLogs.length > 0 ? (
                <div className="max-h-64 space-y-2 overflow-y-auto">
                  {classroom.activityLogs.map((log: ActivityLog) => (
                    <div key={log.id} className="rounded-md bg-muted/70 px-3 py-2 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-1.5">
                          {actionIcon(log.action)}
                          <span className={`inline-block rounded px-2 py-0.5 font-semibold ${getActionStyle(log.action)}`}>
                            {log.action}
                          </span>
                        </div>
                        <span className="text-muted-foreground">{formatRelativeTime(log.createdAt)}</span>
                      </div>
                      <div className="mt-1 text-muted-foreground">By: {log.userName || "Unknown"}</div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="py-3 text-center text-xs text-muted-foreground">No activity yet</div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}
