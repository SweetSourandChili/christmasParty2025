import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET user notification count
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { notificationCount: true },
    });

    return NextResponse.json({ notificationCount: user?.notificationCount || 0 });
  } catch (error) {
    console.error("Get notification count error:", error);
    return NextResponse.json(
      { error: "Failed to get notification count" },
      { status: 500 }
    );
  }
}

// POST increment notification count
export async function POST() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        notificationCount: {
          increment: 1,
        },
      },
      select: { notificationCount: true },
    });

    return NextResponse.json({ notificationCount: user.notificationCount });
  } catch (error) {
    console.error("Update notification count error:", error);
    return NextResponse.json(
      { error: "Failed to update notification count" },
      { status: 500 }
    );
  }
}

