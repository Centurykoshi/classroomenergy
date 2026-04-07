import { NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();
const MANUAL_OFF_LOCK_MS = 10000;

// GET endpoint for ESP8266 to poll current state
export async function GET() {
    try {
        const classrooms = await prisma.classroom.findMany({
            select: {
                id: true,
                name: true,
                isLightOn: true,
                arduinoPin: true
            },
            orderBy: {
                name: 'asc'
            }
        });

        // Manual lock = any recent manual command within the lock window.
        // This allows the ESP8266 to avoid spamming motion intents during the window.
        const lockStartedAt = new Date(Date.now() - MANUAL_OFF_LOCK_MS);
        const recentManualCommands = await prisma.activityLog.findMany({
            where: {
                action: {
                    in: ["ON", "OFF", "FORCE_OFF"]
                },
                createdAt: {
                    gte: lockStartedAt
                },
                NOT: {
                    userName: "Motion Sensor (Auto)"
                }
            },
            select: {
                classroomId: true,
                action: true,
                createdAt: true
            },
            orderBy: {
                createdAt: "desc"
            }
        });

        const latestManualByClassroom = new Map<string, { action: string; createdAt: Date }>();
        for (const log of recentManualCommands) {
            if (!latestManualByClassroom.has(log.classroomId)) {
                latestManualByClassroom.set(log.classroomId, { action: log.action, createdAt: log.createdAt });
            }
        }

        // Check for recent FORCE_OFF actions (within lock window)
        const recentForceOffs = await prisma.activityLog.findMany({
            where: {
                action: "FORCE_OFF",
                createdAt: {
                    gte: new Date(Date.now() - MANUAL_OFF_LOCK_MS)
                }
            },
            select: {
                classroomId: true
            }
        });

        const forceOffClassroomIds = new Set(recentForceOffs.map(log => log.classroomId));

        // Format response for ESP8266
        const nowMs = Date.now();
        const response = classrooms.map(classroom => {
            const latestManual = latestManualByClassroom.get(classroom.id);
            const manualLockRemainingMs = latestManual
                ? Math.max(0, MANUAL_OFF_LOCK_MS - (nowMs - latestManual.createdAt.getTime()))
                : 0;

            return {
            id: classroom.id,
            name: classroom.name,
            pin: classroom.arduinoPin || 0,
            state: classroom.isLightOn ? 1 : 0,
            forceOff: forceOffClassroomIds.has(classroom.id),
            manualLock: manualLockRemainingMs > 0,
            manualLockAction: latestManual?.action ?? null,
            manualLockRemainingMs
            };
        });

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching state for ESP8266:", error);
        return NextResponse.json(
            { error: "Failed to fetch state" },
            { status: 500 }
        );
    }
}
