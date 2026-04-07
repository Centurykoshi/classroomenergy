"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Plus } from "lucide-react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { authClient } from "@/lib/authclient";
import { Button } from "@/Components/ui/button";
import { Card, CardContent } from "@/Components/ui/card";
import GobackButton from "./GoBackButton";
import { AddClassroomForm } from "@/Components/dashboard/add-classroom-form";
import { ClassroomCard } from "@/Components/dashboard/classroom-card";
import { ClassroomSkeletonGrid } from "@/Components/dashboard/classroom-skeleton-grid";
import { DashboardFilters } from "@/Components/dashboard/dashboard-filters";
import { DashboardStats } from "@/Components/dashboard/dashboard-stats";
import { SetupInstructionsCard } from "@/Components/dashboard/setup-instructions-card";
import { SyncStatus } from "@/Components/dashboard/sync-status";
import { ThemeSwitcher } from "@/Components/dashboard/theme-switcher";
import {
  ActivityLog,
  Classroom,
  DashboardFilter,
  MANUAL_OFF_LOCK_MS,
} from "@/Components/dashboard/types";

const DASHBOARD_REFRESH_MS = 3000;

function getLatestActionTime(classroom: Classroom, action: string): number | null {
  const logs = classroom.activityLogs ?? [];
  for (const log of logs) {
    if (log.action === action) {
      return new Date(log.createdAt).getTime();
    }
  }
  return null;
}

function getLockRemainingMs(classroom: Classroom, nowMs: number): number {
  const latestForceOffMs = getLatestActionTime(classroom, "FORCE_OFF");
  if (!latestForceOffMs) return 0;

  const remaining = MANUAL_OFF_LOCK_MS - (nowMs - latestForceOffMs);
  return Math.max(0, remaining);
}

function isToday(dateIso: string): boolean {
  const d = new Date(dateIso);
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export default function DashboardPage() {
  const router = useRouter();
  const { data: session, isPending } = authClient.useSession();

  const [classrooms, setClassrooms] = useState<Classroom[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newClassroom, setNewClassroom] = useState({ name: "", description: "", arduinoPin: "" });
  const [toggling, setToggling] = useState<string | null>(null);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [activeFilter, setActiveFilter] = useState<DashboardFilter>("all");
  const [lastSyncedAt, setLastSyncedAt] = useState<Date | null>(null);
  const [isConnected, setIsConnected] = useState(true);
  const [nowMs, setNowMs] = useState(Date.now());

  const lockStateRef = useRef<Map<string, boolean>>(new Map());

  useEffect(() => {
    if (isPending) return;
    if (!session) {
      router.push("/Login");
      return;
    }
    void fetchClassrooms(true);
  }, [session, isPending, router]);

  useEffect(() => {
    if (!session) return;
    const refreshTimer = setInterval(() => {
      void fetchClassrooms();
    }, DASHBOARD_REFRESH_MS);
    return () => clearInterval(refreshTimer);
  }, [session]);

  useEffect(() => {
    const clockTimer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(clockTimer);
  }, []);

  const fetchClassrooms = async (isInitial = false) => {
    try {
      const response = await fetch("/api/classrooms");
      if (!response.ok) {
        throw new Error("Failed to fetch classrooms");
      }

      const data: Classroom[] = await response.json();
      const classroomsWithLogs = await Promise.all(
        data.map(async (classroom) => {
          try {
            const logsResponse = await fetch(`/api/classrooms/${classroom.id}/logs?limit=8`);
            if (logsResponse.ok) {
              const logs: ActivityLog[] = await logsResponse.json();
              return { ...classroom, activityLogs: logs };
            }
          } catch (error) {
            console.error(`Error fetching logs for classroom ${classroom.id}:`, error);
          }
          return classroom;
        })
      );

      setClassrooms(classroomsWithLogs);
      setIsConnected(true);
      setLastSyncedAt(new Date());

      classroomsWithLogs.forEach((classroom) => {
        const lockRemaining = getLockRemainingMs(classroom, Date.now());
        const lockActiveNow = lockRemaining > 0;
        const lockActiveBefore = lockStateRef.current.get(classroom.id) ?? false;

        if (lockActiveBefore && !lockActiveNow) {
          toast.success(`${classroom.name}: Manual lock expired, automation resumed.`, {
            position: "top-right",
            duration: 3500,
          });
        }

        lockStateRef.current.set(classroom.id, lockActiveNow);
      });
    } catch (error) {
      console.error("Error fetching classrooms:", error);
      setIsConnected(false);
      if (!isInitial) {
        toast.error("Dashboard lost sync. Retrying automatically...", {
          position: "top-right",
          duration: 3000,
        });
      }
    } finally {
      setLoading(false);
    }
  };

  const toggleLight = async (classroomId: string, currentState: boolean, force = false) => {
    const requestForce = force;
    setToggling(classroomId);
    try {
      const response = await fetch(`/api/classrooms/${classroomId}/toggle`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          action: currentState ? "OFF" : "ON",
          userId: session?.user?.id,
          userName: session?.user?.name || session?.user?.email,
          force: requestForce,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to toggle light");
      }

      if (requestForce) {
        const target = classrooms.find((c) => c.id === classroomId);
        if (target) {
          toast.warning(`${target.name}: Manual lock started for 10 seconds.`, {
            position: "top-right",
            duration: MANUAL_OFF_LOCK_MS,
          });
          lockStateRef.current.set(classroomId, true);
        }
      }

      await fetchClassrooms();
    } catch (error) {
      console.error("Error toggling light:", error);
      toast.error("Unable to apply command. Please retry.", { position: "top-right" });
    } finally {
      setToggling(null);
    }
  };

  const handleAddClassroom = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch("/api/classrooms", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newClassroom),
      });

      if (!response.ok) {
        throw new Error("Failed to add classroom");
      }

      setShowAddForm(false);
      setNewClassroom({ name: "", description: "", arduinoPin: "" });
      toast.success("Classroom created.", { position: "top-right" });
      await fetchClassrooms();
    } catch (error) {
      console.error("Error adding classroom:", error);
      toast.error("Could not create classroom.", { position: "top-right" });
    }
  };

  const handleDeleteClassroom = async (classroomId: string) => {
    setDeleting(classroomId);
    try {
      const response = await fetch(`/api/classrooms?id=${classroomId}`, {
        method: "DELETE",
      });

      if (!response.ok) {
        throw new Error("Failed to delete classroom");
      }

      setDeleteConfirmId(null);
      toast.success("Classroom deleted.", { position: "top-right" });
      await fetchClassrooms();
    } catch (error) {
      console.error("Error deleting classroom:", error);
      toast.error("Delete failed.", { position: "top-right" });
    } finally {
      setDeleting(null);
    }
  };

  const enrichedClassrooms = useMemo(
    () =>
      classrooms.map((classroom) => ({
        ...classroom,
        lockRemainingMs: getLockRemainingMs(classroom, nowMs),
      })),
    [classrooms, nowMs]
  );

  const counts = useMemo(() => {
    const onCount = enrichedClassrooms.filter((c) => c.isLightOn).length;
    const lockedCount = enrichedClassrooms.filter((c) => c.lockRemainingMs > 0).length;
    return {
      all: enrichedClassrooms.length,
      on: onCount,
      off: enrichedClassrooms.length - onCount,
      locked: lockedCount,
    } satisfies Record<DashboardFilter, number>;
  }, [enrichedClassrooms]);

  const blockedTodayCount = useMemo(() => {
    return enrichedClassrooms.reduce((sum, classroom) => {
      const blocked = (classroom.activityLogs ?? []).filter(
        (log) => log.action === "MOTION_BLOCKED" && isToday(log.createdAt)
      ).length;
      return sum + blocked;
    }, 0);
  }, [enrichedClassrooms]);

  const filteredClassrooms = useMemo(() => {
    if (activeFilter === "all") return enrichedClassrooms;
    if (activeFilter === "on") return enrichedClassrooms.filter((c) => c.isLightOn);
    if (activeFilter === "off") return enrichedClassrooms.filter((c) => !c.isLightOn);
    return enrichedClassrooms.filter((c) => c.lockRemainingMs > 0);
  }, [enrichedClassrooms, activeFilter]);

  if (isPending) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-primary" />
      </div>
    );
  }

  if (!session) return null;

  return (
    <div className="dashboard-shell flex min-h-screen flex-col">
      <header className="sticky top-0 z-20 border-b border-border/70 bg-background/85 backdrop-blur-md">
        <div className="mx-auto flex w-full max-w-7xl flex-wrap items-center justify-between gap-3 px-4 py-3">
          <div className="flex items-center gap-3">
            <GobackButton Prop={{ value: "HomePage", url: "/" }} />
            <div>
              <p className="text-sm font-semibold tracking-wide">Classroom Energy</p>
              <p className="text-xs text-muted-foreground">Smart lighting command center</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <SyncStatus isConnected={isConnected} lastSyncedAt={lastSyncedAt} />
            <ThemeSwitcher />
            <Button className="gap-2" onClick={() => setShowAddForm((prev) => !prev)}>
              <Plus className="h-4 w-4" />
              Add Classroom
            </Button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-7xl flex-1 px-4 pb-10 pt-8">
        <motion.div initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.45 }}>
          <div className="mb-8">
            <h1 className="text-4xl font-bold tracking-tight">Classroom Energy Dashboard</h1>
            <p className="mt-2 text-muted-foreground">Live control, manual lock safety, and motion-aware automation.</p>
          </div>

          <DashboardStats
            total={counts.all}
            onCount={counts.on}
            lockedCount={counts.locked}
            blockedToday={blockedTodayCount}
          />

          <div className="my-5 flex flex-wrap items-center justify-between gap-3">
            <DashboardFilters activeFilter={activeFilter} counts={counts} onChange={setActiveFilter} />
            <p className="text-sm text-muted-foreground">Showing {filteredClassrooms.length} classroom(s)</p>
          </div>

          {showAddForm ? (
            <AddClassroomForm
              value={newClassroom}
              onChange={setNewClassroom}
              onSubmit={handleAddClassroom}
              onCancel={() => setShowAddForm(false)}
            />
          ) : null}

          {loading ? (
            <ClassroomSkeletonGrid />
          ) : filteredClassrooms.length === 0 ? (
            <Card>
              <CardContent className="py-12 text-center">
                <Lightbulb className="mx-auto mb-4 h-16 w-16 text-muted-foreground" />
                <h3 className="mb-2 text-lg font-semibold">No classrooms in this filter</h3>
                <p className="mb-4 text-muted-foreground">Try switching filters or add a new classroom.</p>
                <Button onClick={() => setShowAddForm(true)} className="gap-2">
                  <Plus className="h-4 w-4" />
                  Add Classroom
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
              {filteredClassrooms.map((classroom, index) => (
                <ClassroomCard
                  key={classroom.id}
                  classroom={classroom}
                  index={index}
                  lockRemainingMs={classroom.lockRemainingMs}
                  isToggling={toggling === classroom.id}
                  isDeleting={deleting === classroom.id}
                  deleteConfirmOpen={deleteConfirmId === classroom.id}
                  onToggle={toggleLight}
                  onForceOff={(id) => toggleLight(id, true, true)}
                  onDeleteClick={setDeleteConfirmId}
                  onDeleteCancel={() => setDeleteConfirmId(null)}
                  onDeleteConfirm={handleDeleteClassroom}
                />
              ))}
            </div>
          )}
        </motion.div>
      </main>

      <footer className="border-t border-border/70 bg-card/55">
        <div className="mx-auto w-full max-w-7xl px-4 py-6">
          <SetupInstructionsCard />
        </div>
      </footer>
    </div>
  );
}
