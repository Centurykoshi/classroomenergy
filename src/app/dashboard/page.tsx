"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Lightbulb, Power, History, Plus } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/Components/ui/card";
import { Button } from "@/Components/ui/button";
import { authClient } from "@/lib/authclient";
import { useRouter } from "next/navigation";

interface Classroom {
    id: string;
    name: string;
    isLightOn: boolean;
    description: string | null;
    arduinoPin: number | null;
}

export default function DashboardPage() {
    const router = useRouter();
    const { data: session } = authClient.useSession();
    const [classrooms, setClassrooms] = useState<Classroom[]>([]);
    const [loading, setLoading] = useState(true);
    const [toggling, setToggling] = useState<string | null>(null);
    const [showAddForm, setShowAddForm] = useState(false);
    const [newClassroom, setNewClassroom] = useState({
        name: "",
        description: "",
        arduinoPin: ""
    });

    useEffect(() => {
        // Redirect if not logged in
        if (!session) {
            router.push("/Login");
            return;
        }
        
        fetchClassrooms();
    }, [session, router]);

    const fetchClassrooms = async () => {
        try {
            const response = await fetch("/api/classrooms");
            if (response.ok) {
                const data = await response.json();
                setClassrooms(data);
            }
        } catch (error) {
            console.error("Error fetching classrooms:", error);
        } finally {
            setLoading(false);
        }
    };

    const toggleLight = async (classroomId: string, currentState: boolean) => {
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
                }),
            });

            if (response.ok) {
                // Update local state
                setClassrooms(classrooms.map(c =>
                    c.id === classroomId ? { ...c, isLightOn: !currentState } : c
                ));
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

    if (!session) {
        return null;
    }

    return (
        <div className="min-h-screen bg-background pt-24 pb-12 px-4">
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
                                            <Card className={`transition-all ${
                                                classroom.isLightOn
                                                    ? "border-primary shadow-lg shadow-primary/20"
                                                    : ""
                                            }`}>
                                                <CardHeader>
                                                    <div className="flex items-center justify-between">
                                                        <CardTitle className="flex items-center gap-2">
                                                            <Lightbulb
                                                                className={`w-5 h-5 ${
                                                                    classroom.isLightOn
                                                                        ? "text-yellow-500 fill-yellow-500"
                                                                        : "text-muted-foreground"
                                                                }`}
                                                            />
                                                            {classroom.name}
                                                        </CardTitle>
                                                        <div
                                                            className={`px-2 py-1 rounded-full text-xs font-semibold ${
                                                                classroom.isLightOn
                                                                    ? "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400"
                                                                    : "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400"
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
                                                    <div className="space-y-3">
                                                        {classroom.arduinoPin && (
                                                            <div className="text-sm text-muted-foreground">
                                                                Pin: {classroom.arduinoPin}
                                                            </div>
                                                        )}
                                                        <Button
                                                            onClick={() => toggleLight(classroom.id, classroom.isLightOn)}
                                                            disabled={toggling === classroom.id}
                                                            className={`w-full ${
                                                                classroom.isLightOn
                                                                    ? "bg-red-600 hover:bg-red-700"
                                                                    : "bg-green-600 hover:bg-green-700"
                                                            }`}
                                                        >
                                                            <Power className="w-4 h-4 mr-2" />
                                                            {toggling === classroom.id
                                                                ? "Processing..."
                                                                : classroom.isLightOn
                                                                ? "Turn OFF"
                                                                : "Turn ON"}
                                                        </Button>
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
