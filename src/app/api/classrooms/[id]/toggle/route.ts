import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// Toggle light state
export async function POST(
    request: NextRequest,
    context: { params: Promise<{ id: string }> }
) {
    try {
        const { id } = await context.params;
        const body = await request.json();
        const { action, userId, userName, force } = body; // action: "ON" or "OFF", force: boolean

        // Get current classroom
        const classroom = await prisma.classroom.findUnique({
            where: { id }
        });

        if (!classroom) {
            return NextResponse.json(
                { error: "Classroom not found" },
                { status: 404 }
            );
        }

        // Update classroom light state
        // If force is true and action is OFF, mark it for force OFF on ESP8266
        const updatedClassroom = await prisma.classroom.update({
            where: { id },
            data: {
                isLightOn: action === "ON",
                // Store force flag temporarily (you can add this to schema if needed)
            }
        });

        // Log the activity with force flag if present
        await prisma.activityLog.create({
            data: {
                classroomId: id,
                action: force && action === "OFF" ? "FORCE_OFF" : action,
                userId: userId || null,
                userName: userName || "Unknown User"
            }
        });

        return NextResponse.json({
            success: true,
            classroom: updatedClassroom,
            force: force && action === "OFF",
            message: force && action === "OFF" ? `Light force turned OFF` : `Light turned ${action}`
        });
    } catch (error) {
        console.error("Error toggling light:", error);
        return NextResponse.json(
            { error: "Failed to toggle light" },
            { status: 500 }
        );
    }
}
