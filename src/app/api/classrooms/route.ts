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

// DELETE a classroom
export async function DELETE(request: NextRequest) {
    try {
        const { searchParams } = new URL(request.url);
        const classroomId = searchParams.get("id");

        if (!classroomId) {
            return NextResponse.json(
                { error: "Classroom ID is required" },
                { status: 400 }
            );
        }

        // Verify classroom exists
        const classroom = await prisma.classroom.findUnique({
            where: { id: classroomId }
        });

        if (!classroom) {
            return NextResponse.json(
                { error: "Classroom not found" },
                { status: 404 }
            );
        }

        // Delete classroom (cascade will auto-delete activity logs)
        await prisma.classroom.delete({
            where: { id: classroomId }
        });

        return NextResponse.json({
            success: true,
            message: `Classroom "${classroom.name}" deleted successfully`
        });
    } catch (error) {
        console.error("Error deleting classroom:", error);
        return NextResponse.json(
            { error: "Failed to delete classroom" },
            { status: 500 }
        );
    }
}
