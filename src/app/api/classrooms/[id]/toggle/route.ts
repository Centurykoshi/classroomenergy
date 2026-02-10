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
        const { action, userId, userName } = body; // action: "ON" or "OFF"

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
        const updatedClassroom = await prisma.classroom.update({
            where: { id },
            data: {
                isLightOn: action === "ON"
            }
        });

        // Log the activity
        await prisma.activityLog.create({
            data: {
                classroomId: id,
                action: action,
                userId: userId || null,
                userName: userName || "Unknown User"
            }
        });

        return NextResponse.json({
            success: true,
            classroom: updatedClassroom,
            message: `Light turned ${action}`
        });
    } catch (error) {
        console.error("Error toggling light:", error);
        return NextResponse.json(
            { error: "Failed to toggle light" },
            { status: 500 }
        );
    }
}
