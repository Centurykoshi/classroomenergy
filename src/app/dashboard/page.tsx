"use client";

import { useState, useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Power, History, Plus, Trash2 } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { authClient } from "@/lib/authclient";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import GobackButton from "./GoBackButton";

const MANUAL_OFF_LOCK_MS = 10000;
const DASHBOARD_REFRESH_MS = 3000;

interface ActivityLog {
    id: string;
    createdAt: string;
    action: string;
    userId: string | null;
    userName: string | null;
}

interface Classroom {
    id: string;
    name: string;
    isLightOn: boolean;
    description: string | null;
    arduinoPin: number | null;
    activityLogs?: ActivityLog[];
}

export default function DashboardPage() {
    const router = useRouter();
    const { data: session, isPending } = authClient.useSession();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
    const [deleting, setDeleting] = useState<string | null>(null);
    const shownMotionBlockedToasts = useRef<Set<string>>(new Set());
    const [newClassroom, setNewClassroom] = useState({
        name: "",
        description: "",
        arduinoPin: ""
    });

    useEffect(() => {
        // Don't redirect if still checking session
        if (isPending) return;

        // Redirect if not logged in
        if (!session) {
            router.push("/Login");
            return;
        }

        fetchClassrooms();
    }, [session, isPending, router]);

    useEffect(() => {
        if (!session) return;

        const interval = setInterval(() => {
            fetchClassrooms();
        }, DASHBOARD_REFRESH_MS);

        return () => clearInterval(interval);
    }, [session]);

    const fetchClassrooms = async () => {
        try {
            const response = await fetch("/api/classrooms");
            if (response.ok) {
                const data: Classroom[] = await response.json();
                
                // Fetch activity logs for each classroom
                const classroomsWithLogs = await Promise.all(
                    data.map(async (classroom: Classroom) => {
                        try {
                            const logsResponse = await fetch(`/api/classrooms/${classroom.id}/logs?limit=5`);
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

                classroomsWithLogs.forEach((classroom) => {
                    const blockedLog = classroom.activityLogs?.find(
                        (log) => log.action === "MOTION_BLOCKED"
                    );

                    if (!blockedLog) return;
                    if (shownMotionBlockedToasts.current.has(blockedLog.id)) return;

                    const blockedAtMs = new Date(blockedLog.createdAt).getTime();
                    if (Date.now() - blockedAtMs > MANUAL_OFF_LOCK_MS + DASHBOARD_REFRESH_MS) return;

                    shownMotionBlockedToasts.current.add(blockedLog.id);
                    toast.info(
                        `${classroom.name}: Motion detected. Change will apply after 10 seconds.`,
                        {
                            position: "top-right",
                            duration: MANUAL_OFF_LOCK_MS,
                        }
                    );
                });
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLight = async (classroomId: string, currentState: boolean, force: boolean = false) => {
        setToggling(classroomId);
        try {
            const response = await fetch(`/api/classrooms/${classroomId}/toggle`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    action: force ? "OFF" : (currentState ? "OFF" : "ON"),
                    userId: session?.user?.id,
                    userName: session?.user?.name || session?.user?.email,
                    force: force,
                }),
            });

            if (response.ok) {
                // Update local state
                const newState = force ? false : !currentState;
                setClassrooms(classrooms.map(c =>
                    c.id === classroomId ? { ...c, isLightOn: newState } : c
                ));

                // Refresh activity logs for this classroom
                try {
                    const logsResponse = await fetch(`/api/classrooms/${classroomId}/logs?limit=5`);
                    if (logsResponse.ok) {
                        const logs: ActivityLog[] = await logsResponse.json();
                        setClassrooms(prev => prev.map(c =>
                            c.id === classroomId ? { ...c, activityLogs: logs } : c
                        ));
                    }
                } catch (error) {
                    console.error("Error refreshing activity logs:", error);
                }
            }
        } catch (error) {
            console.error("Error toggling light:", error);
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

            if (response.ok) {
                const classroom = await response.json();
                setClassrooms([...classrooms, classroom]);
                setShowAddForm(false);
                setNewClassroom({ name: "", description: "", arduinoPin: "" });
            }
        } catch (error) {
            console.error("Error adding classroom:", error);
        }
    };

    const handleDeleteClassroom = async (classroomId: string) => {
        setDeleting(classroomId);
        try {
            const response = await fetch(`/api/classrooms?id=${classroomId}`, {
                method: "DELETE",
                headers: {
                    "Content-Type": "application/json",
                },
            });

            if (response.ok) {
                // Remove classroom from state
                setClassrooms(classrooms.filter(c => c.id !== classroomId));
                setDeleteConfirmId(null);
            } else {
                const error = await response.json();
                console.error("Error deleting classroom:", error);
                alert("Failed to delete classroom");
            }
        } catch (error) {
            console.error("Error deleting classroom:", error);
            alert("Failed to delete classroom");
        } finally {
            setDeleting(null);
        }
    };

    // Show loading state while checking session
    if (isPending || loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                    <p className="text-muted-foreground">Loading...</p>
                </div>
            </div>
        );
    }

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">

            <div className="absolute top-10 left-1/2 cursor-pointer">

            <GobackButton Prop={{value : "HomePage", url : "/"}} />
            </div>
            <div className="max-w-7xl mx-auto">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                >
                    <div className="flex items-center justify-between mb-8">
                        <div>
                            <h1 className="text-4xl font-bold text-foreground mb-2">
                                Classroom Energy Dashboard
                            </h1>
                            <p className="text-muted-foreground">
                                Control and monitor classroom lighting systems
                            </p>
                        </div>
                        <Button className="gap-2" onClick={() => setShowAddForm(!showAddForm)}>
                            <Plus className="w-4 h-4" />
                            Add Classroom
                        </Button>
                    </div>

                    {loading ? (
                        <div className="text-center py-12">
                            <p className="text-muted-foreground">Loading classrooms...</p>
                        </div>
                    ) : (
                        <>
                            {showAddForm && (
                                <Card className="mb-6">
                                    <CardHeader>
                                        <CardTitle>Add New Classroom</CardTitle>
                                        <CardDescription>Create a new classroom to control</CardDescription>
                                    </CardHeader>
                                    <CardContent>
                                        <form onSubmit={handleAddClassroom} className="space-y-4">
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Classroom Name *
                                                </label>
                                                <input
                                                    type="text"
                                                    required
                                                    placeholder="e.g., Class - 63"
                                                    value={newClassroom.name}
                                                    onChange={(e) => setNewClassroom({ ...newClassroom, name: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Description
                                                </label>
                                                <input
                                                    type="text"
                                                    placeholder="Main classroom with automated lighting"
                                                    value={newClassroom.description}
                                                    onChange={(e) => setNewClassroom({ ...newClassroom, description: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                                />
                                            </div>
                                            <div>
                                                <label className="block text-sm font-medium mb-2">
                                                    Arduino Pin (GPIO)
                                                </label>
                                                <input
                                                    type="number"
                                                    placeholder="5 (for D1)"
                                                    value={newClassroom.arduinoPin}
                                                    onChange={(e) => setNewClassroom({ ...newClassroom, arduinoPin: e.target.value })}
                                                    className="w-full px-3 py-2 border rounded-lg bg-background"
                                                />
                                                <p className="text-xs text-muted-foreground mt-1">
                                                    D1=5, D2=4, D3=0, D4=2, D5=14, D6=12, D7=13, D8=15
                                                </p>
                                            </div>
                                            <div className="flex gap-2">
                                                <Button type="submit" className="flex-1">
                                                    Create Classroom
                                                </Button>
                                                <Button
                                                    type="button"
                                                    variant="outline"
                                                    onClick={() => setShowAddForm(false)}
                                                    className="flex-1"
                                                >
                                                    Cancel
                                                </Button>
                                            </div>
                                        </form>
                                    </CardContent>
                                </Card>
                            )}

                            {classrooms.length === 0 ? (
                                <Card>
                                    <CardContent className="py-12 text-center">
                                        <Lightbulb className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
                                        <h3 className="text-lg font-semibold mb-2">No Classrooms Yet</h3>
                                        <p className="text-muted-foreground mb-4">
                                            Get started by adding your first classroom
                                        </p>
                                        <Button onClick={() => setShowAddForm(true)}>
                                            <Plus className="w-4 h-4 mr-2" />
                                            Add Classroom
                                        </Button>
                                    </CardContent>
                                </Card>
                            ) : (
                                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                                    {classrooms.map((classroom, index) => (
                                        <motion.div
                                            key={classroom.id}
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            transition={{ duration: 0.5, delay: index * 0.1 }}
                                        >
                                            <Card className={`transition-all ${classroom.isLightOn
                                                    ? "border-primary shadow-lg shadow-primary/20"
                                                    : ""
                                                }`}>
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Lightbulb
                                                                className={`w-5 h-5 ${classroom.isLightOn
                                                                        ? "text-yellow-500 fill-yellow-500"
                                                                        : "text-muted-foreground"
                                                                    }`}
                                                            />
                                                            {classroom.name}
                                                        </CardTitle>
                                                        <div
                                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${classroom.isLightOn
                                                                    ? "bg-primary text-secondary dark:bg-primary/30 dark:text-green-400"
                                                                    : "bg-secondary-100 text-primary dark:bg-gray-800 dark:text-gray-400"
                                                                }`}
                                                        >
                                                            {classroom.isLightOn ? "ON" : "OFF"}
                                                        </div>
                                                    </div>
                                                    <CardDescription>
                                                        {classroom.description || "No description"}
                                                    </CardDescription>
                                                </CardHeader>
                                                <CardContent>
                                                    <div className="space-y-4">
                                                        {classroom.arduinoPin && (
                                                            <div className="text-sm text-muted-foreground">
                                                                Pin: {classroom.arduinoPin}
                                                            </div>
                                                        )}
                                                        <Button
                                                            onClick={() => toggleLight(classroom.id, classroom.isLightOn)}
                                                            disabled={toggling === classroom.id}
                                                            className={`w-full ${classroom.isLightOn
                                                                    ? "bg-foreground hover:bg-foreground"
                                                                    : "bg-primary hover:bg-primary/80"
                                                                }`}
                                                        >
                                                            <Power className="w-4 h-4 mr-2" />
                                                            {toggling === classroom.id
                                                                ? "Processing..."
                                                                : classroom.isLightOn
                                                                    ? "Turn OFF"
                                                                    : "Turn ON"}
                                                        </Button>

                                                        {classroom.isLightOn && (
                                                            <Button
                                                                onClick={() => toggleLight(classroom.id, true, true)}
                                                                disabled={toggling === classroom.id}
                                                                variant="destructive"
                                                                className="w-full"
                                                            >
                                                                <Power className="w-4 h-4 mr-2" />
                                                                {toggling === classroom.id ? "Processing..." : "Force OFF"}
                                                            </Button>
                                                        )}

                                                        <Button
                                                            onClick={() => setDeleteConfirmId(classroom.id)}
                                                            disabled={deleting === classroom.id}
                                                            variant="destructive"
                                                            className="w-full"
                                                        >
                                                            <Trash2 className="w-4 h-4 mr-2" />
                                                            {deleting === classroom.id ? "Deleting..." : "Delete Classroom"}
                                                        </Button>

                                                        {/* Delete Confirmation Modal */}
                                                        {deleteConfirmId === classroom.id && (
                                                            <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                                                                <Card className="w-96">
                                                                    <CardHeader>
                                                                        <CardTitle>Delete Classroom?</CardTitle>
                                                                        <CardDescription>
                                                                            Are you sure you want to delete "{classroom.name}"? This action cannot be undone. All activity logs for this classroom will also be deleted.
                                                                        </CardDescription>
                                                                    </CardHeader>
                                                                    <CardContent className="flex gap-3 justify-end">
                                                                        <Button
                                                                            variant="outline"
                                                                            onClick={() => setDeleteConfirmId(null)}
                                                                            disabled={deleting === classroom.id}
                                                                        >
                                                                            Cancel
                                                                        </Button>
                                                                        <Button
                                                                            variant="destructive"
                                                                            onClick={() => handleDeleteClassroom(classroom.id)}
                                                                            disabled={deleting === classroom.id}
                                                                        >
                                                                            {deleting === classroom.id ? "Deleting..." : "Delete"}
                                                                        </Button>
                                                                    </CardContent>
                                                                </Card>
                                                            </div>
                                                        )}

                                                        {/* Activity History */}
                                                        <div className="mt-6 pt-4 border-t">
                                                            <h4 className="text-sm font-semibold mb-3 flex items-center gap-2">
                                                                <History className="w-4 h-4" />
                                                                Activity History
                                                            </h4>
                                                            {classroom.activityLogs && classroom.activityLogs.length > 0 ? (
                                                                <div className="space-y-2 max-h-64 overflow-y-auto">
                                                                    {classroom.activityLogs.map((log) => (
                                                                        <div
                                                                            key={log.id}
                                                                            className="text-xs bg-muted rounded px-3 py-2 flex items-center justify-between"
                                                                        >
                                                                            <div className="flex-1">
                                                                                <div className="flex items-center gap-2">
                                                                                    <span
                                                                                        className={`inline-block px-2 py-0.5 rounded font-semibold text-xs ${
                                                                                            log.action === "ON"
                                                                                                ? "bg-green-500/20 text-green-700 dark:text-green-400"
                                                                                                : log.action === "MOTION_BLOCKED"
                                                                                                    ? "bg-amber-500/20 text-amber-700 dark:text-amber-400"
                                                                                                    : "bg-red-500/20 text-red-700 dark:text-red-400"
                                                                                        }`}
                                                                                    >
                                                                                        {log.action}
                                                                                    </span>
                                                                                    <span className="text-muted-foreground">
                                                                                        {new Date(log.createdAt).toLocaleTimeString([], {
                                                                                            hour: "2-digit",
                                                                                            minute: "2-digit",
                                                                                            second: "2-digit"
                                                                                        })}
                                                                                    </span>
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground mt-1">
                                                                                    By: {log.userName || "Unknown"}
                                                                                </div>
                                                                                <div className="text-xs text-muted-foreground">
                                                                                    {new Date(log.createdAt).toLocaleDateString([], {
                                                                                        month: "short",
                                                                                        day: "numeric"
                                                                                    })}
                                                                                </div>
                                                                            </div>
                                                                        </div>
                                                                    ))}
                                                                </div>
                                                            ) : (
                                                                <div className="text-xs text-muted-foreground text-center py-3">
                                                                    No activity yet
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                </CardContent>
                                            </Card>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </>
                    )}

                    <Card className="mt-8">
                        <CardHeader>
                            <CardTitle className="flex items-center gap-2">
                                <History className="w-5 h-5" />
                                Setup Instructions for ESP8266
                            </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="bg-muted p-4 rounded-lg">
                                <h4 className="font-semibold mb-2">Polling URL:</h4>
                                <code className="text-sm bg-background px-2 py-1 rounded">
                                    {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:3000'}/api/esp8266/state
                                </code>
                            </div>
                            <div className="text-sm text-muted-foreground space-y-2">
                                <p>1. ESP8266 should poll the above URL every 2-5 seconds</p>
                                <p>2. Response format: <code className="bg-muted px-1 rounded">{'[{name, pin, state}]'}</code></p>
                                <p>3. State: 1 = ON, 0 = OFF</p>
                                <p>4. Connect relay to the specified pin for each classroom</p>
                            </div>
                        </CardContent>
                    </Card>
                </motion.div>
            </div>
        </div>
    );
}
