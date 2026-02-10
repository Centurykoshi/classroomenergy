import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

// GET all classrooms
export async function GET() {
    try {
        const classrooms = await prisma.classroom.findMany({
            orderBy: {
                name: 'asc'
            }
        });
        
        return NextResponse.json(classrooms);
    } catch (error) {
        console.error("Error fetching classrooms:", error);
        return NextResponse.json(
            { error: "Failed to fetch classrooms" },
            { status: 500 }
        );
    }
}

// POST create new classroom
export async function POST(request: NextRequest) {
    try {
        const body = await request.json();
        const { name, description, arduinoPin } = body;

        const classroom = await prisma.classroom.create({
            data: {
                name,
                description,
                arduinoPin: arduinoPin ? parseInt(arduinoPin) : null,
                isLightOn: false
            }
        });

        return NextResponse.json(classroom);
    } catch (error) {
        console.error("Error creating classroom:", error);
        return NextResponse.json(
            { error: "Failed to create classroom" },
            { status: 500 }
        );
    }
}
