import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// GET all tasks
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const tasks = await prisma.task.findMany({
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(tasks);
  } catch (error) {
    console.error("Get tasks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch tasks" },
      { status: 500 }
    );
  }
}

// POST create task
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { description, type } = await request.json();

    if (!description || description.trim().length === 0) {
      return NextResponse.json(
        { error: "Description is required" },
        { status: 400 }
      );
    }

    if (!type || !["bring", "handle"].includes(type)) {
      return NextResponse.json(
        { error: "Type must be 'bring' or 'handle'" },
        { status: 400 }
      );
    }

    const task = await prisma.task.create({
      data: {
        description: description.trim(),
        type,
        userId: session.user.id,
      },
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
    });

    // Log the action
    await logAction(
      session.user.id,
      "ADD_TASK",
      `Added ${type === "bring" ? "contribution" : "task"}: ${description.trim().substring(0, 50)}`,
      { taskId: task.id, type }
    );

    return NextResponse.json(task, { status: 201 });
  } catch (error) {
    console.error("Create task error:", error);
    return NextResponse.json(
      { error: "Failed to create task" },
      { status: 500 }
    );
  }
}

