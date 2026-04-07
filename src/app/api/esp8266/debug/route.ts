import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// GET endpoint for debugging ESP8266 state
// Returns current classroom states and recent activity
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

        // Get recent FORCE_OFF actions (within last 5 seconds)
        const recentForceOffs = await prisma.activityLog.findMany({
            where: {
                action: "FORCE_OFF",
                createdAt: {
                    gte: new Date(Date.now() - 5000)
                }
            },
            select: {
                classroomId: true,
                createdAt: true,
                userName: true
            },
            orderBy: {
                createdAt: 'desc'
            }
        });

        // Get last 10 activity logs
        const recentActivity = await prisma.activityLog.findMany({
            orderBy: {
                createdAt: 'desc'
            },
            take: 10,
            select: {
                id: true,
                classroomId: true,
                action: true,
                userName: true,
                createdAt: true
            }
        });

        const forceOffClassroomIds = new Set(recentForceOffs.map(log => log.classroomId));

        const debugInfo = {
            timestamp: new Date().toISOString(),
            classrooms: classrooms.map(classroom => ({
                id: classroom.id,
                name: classroom.name,
                pin: classroom.arduinoPin || 0,
                state: classroom.isLightOn ? 1 : 0,
                forceOff: forceOffClassroomIds.has(classroom.id),
                forceOffExpiresIn: forceOffClassroomIds.has(classroom.id) ? "~5s" : null
            })),
            recentForceOffs: recentForceOffs.map(log => ({
                classroomId: log.classroomId,
                userName: log.userName,
                timestamp: log.createdAt
            })),
            recentActivity: recentActivity
        };

        return NextResponse.json(debugInfo);
    } catch (error) {
        console.error("Error fetching debug info for ESP8266:", error);
        return NextResponse.json(
            { error: "Failed to fetch debug info" },
            { status: 500 }
        );
    }
}
