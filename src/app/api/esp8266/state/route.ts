import { NextRequest, NextResponse } from "next/server";
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
        const response = classrooms.map(classroom => ({
            id: classroom.id,
            name: classroom.name,
            pin: classroom.arduinoPin || 0,
            state: classroom.isLightOn ? 1 : 0,
            forceOff: forceOffClassroomIds.has(classroom.id)
        }));

        return NextResponse.json(response);
    } catch (error) {
        console.error("Error fetching state for ESP8266:", error);
        return NextResponse.json(
            { error: "Failed to fetch state" },
            { status: 500 }
        );
    }
}
