import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();
const MANUAL_OFF_LOCK_MS = 10000;
const MOTION_BLOCKED_ACTION = "MOTION_BLOCKED";

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

        // If manual FORCE_OFF is active, motion-triggered ON must be ignored.
        if (normalizedAction === "ON") {
            const lockStartedAt = new Date(Date.now() - MANUAL_OFF_LOCK_MS);

            const latestForceOff = await prisma.activityLog.findFirst({
                where: {
                    classroomId,
                    action: "FORCE_OFF",
                    createdAt: {
                        gte: lockStartedAt
                    }
                },
                orderBy: {
                    createdAt: "desc"
                }
            });

            if (latestForceOff) {
                const existingBlockedLog = await prisma.activityLog.findFirst({
                    where: {
                        classroomId,
                        action: MOTION_BLOCKED_ACTION,
                        createdAt: {
                            gte: latestForceOff.createdAt
                        }
                    },
                    orderBy: {
                        createdAt: "desc"
                    }
                });

                if (!existingBlockedLog) {
                    await prisma.activityLog.create({
                        data: {
                            classroomId,
                            action: MOTION_BLOCKED_ACTION,
                            userId: null,
                            userName: "Motion Sensor (Blocked by Manual OFF)"
                        }
                    });
                }

                const elapsed = Date.now() - latestForceOff.createdAt.getTime();
                const lockRemainingMs = Math.max(0, MANUAL_OFF_LOCK_MS - elapsed);

                return NextResponse.json({
                    success: true,
                    classroom,
                    motionBlockedByLock: true,
                    lockWindowMs: MANUAL_OFF_LOCK_MS,
                    lockRemainingMs,
                    message: `Motion detected, manual OFF lock active for ${Math.ceil(lockRemainingMs / 1000)} more seconds`
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
