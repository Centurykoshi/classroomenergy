import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

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

        // Format response for ESP8266
        const response = classrooms.map(classroom => ({
            name: classroom.name,
            pin: classroom.arduinoPin || 0,
            state: classroom.isLightOn ? 1 : 0
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
