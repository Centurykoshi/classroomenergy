import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// POST endpoint for ESP8266 to report motion-triggered state changes
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { classroomId, action, pin } = body; // action: "ON" or "OFF"

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

        // Only update if state actually changed
        const newState = action === "ON";
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
                action: action,
                userId: null,
                userName: "Motion Sensor (Auto)"
            }
        });

        return NextResponse.json({
            success: true,
            classroom: updatedClassroom,
            message: `Light turned ${action} by motion sensor on pin ${pin}`
        });
    } catch (error) {
        console.error("Error updating motion state:", error);
        return NextResponse.json(
            { error: "Failed to update motion state" },
            { status: 500 }
        );
    }
}
