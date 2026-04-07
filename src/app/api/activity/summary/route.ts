import { NextRequest, NextResponse } from "next/server";
import { PrismaClient } from "@/generated/prisma";

const prisma = new PrismaClient();

type PeriodCounts = {
  on: number;
  off: number;
};

function startOfToday(now: Date): Date {
  const d = new Date(now);
  d.setHours(0, 0, 0, 0);
  return d;
}

function daysAgo(now: Date, days: number): Date {
  const d = new Date(now);
  d.setDate(d.getDate() - days);
  return d;
}

async function getCountsSince(start: Date, classroomId?: string | null): Promise<PeriodCounts> {
  const baseWhere = classroomId ? { classroomId } : {};

  const on = await prisma.activityLog.count({
    where: {
      ...baseWhere,
      createdAt: { gte: start },
      action: "ON",
    },
  });

  const off = await prisma.activityLog.count({
    where: {
      ...baseWhere,
      createdAt: { gte: start },
      action: { in: ["OFF", "FORCE_OFF"] },
    },
  });

  return { on, off };
}

// GET /api/activity/summary?classroomId=...
// Returns counts of ON/OFF actions for today, last 7 days, last 30 days.
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const classroomId = searchParams.get("classroomId");

    const now = new Date();

    const [day, week, month] = await Promise.all([
      getCountsSince(startOfToday(now), classroomId),
      getCountsSince(daysAgo(now, 7), classroomId),
      getCountsSince(daysAgo(now, 30), classroomId),
    ]);

    return NextResponse.json({
      classroomId: classroomId ?? null,
      day,
      week,
      month,
    });
  } catch (error) {
    console.error("Error building activity summary:", error);
    return NextResponse.json({ error: "Failed to build activity summary" }, { status: 500 });
  }
}
