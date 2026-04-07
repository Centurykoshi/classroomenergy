import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();
const MANUAL_OFF_LOCK_MS = 10000;

// POST endpoint for ESP8266 to report motion-triggered state changes
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { classroomId, action, pin } = body; // action: "ON" or "OFF"
        const normalizedAction = typeof action === "string" ? action.toUpperCase() : "";

        if (!classroomId || (normalizedAction !== "ON" && normalizedAction !== "OFF")) {
            return NextResponse.json(
                { error: "Invalid payload. classroomId and action (ON/OFF) are required" },
                { status: 400 }
            );
        }

        // Get classroom details
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId }
        });

        if (!classroom) {
            return NextResponse.json(
                { error: "Classroom not found" },
                { status: 404 }
            );
        }

        // Respect recent manual commands for the lock window so sensor events don't instantly undo UI actions.
        const lockStartedAt = new Date(Date.now() - MANUAL_OFF_LOCK_MS);
        const latestManualCommand = await prisma.activityLog.findFirst({
            where: {
                classroomId,
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
            orderBy: {
                createdAt: "desc"
            }
        });

        if (latestManualCommand) {
            const manualTargetOn = latestManualCommand.action === "ON";
            const sensorTargetOn = normalizedAction === "ON";

            if (manualTargetOn !== sensorTargetOn) {
                const elapsed = Date.now() - latestManualCommand.createdAt.getTime();
                const lockRemainingMs = Math.max(0, MANUAL_OFF_LOCK_MS - elapsed);

                return NextResponse.json({
                    success: true,
                    classroom,
                    motionBlockedByLock: true,
                    lockWindowMs: MANUAL_OFF_LOCK_MS,
                    lockRemainingMs,
                    manualCommandAction: latestManualCommand.action,
                    message: "Sensor event ignored due to a recent manual command"
                });
            }
        }

        // Only update if state actually changed
        const newState = normalizedAction === "ON";
        if (classroom.isLightOn === newState) {
            return NextResponse.json({
                success: true,
                message: "State already correct, no update needed"
            });
        }

        // Update classroom light state
        const updatedClassroom = await prisma.classroom.update({
            where: { id: classroomId },
            data: {
                isLightOn: newState
            }
        });

        // Log the activity with motion sensor note
        await prisma.activityLog.create({
            data: {
                classroomId: classroomId,
                action: normalizedAction,
                userId: null,
                userName: "Motion Sensor (Auto)"
            }
        });

        return NextResponse.json({
            success: true,
            classroom: updatedClassroom,
            message: `Light turned ${normalizedAction} by motion sensor on pin ${pin}`
        });
    } catch (error) {
        console.error("Error updating motion state:", error);
        return NextResponse.json(
            { error: "Failed to update motion state" },
            { status: 500 }
        );
    }
}
