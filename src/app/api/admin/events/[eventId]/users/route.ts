import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Admin joins a user to an event
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ eventId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { eventId } = await params;
    const { userId, joining } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    // Upsert event registration
    const registration = await prisma.eventRegistration.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        joining,
      },
      create: {
        userId,
        eventId,
        joining,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error("Admin join user to event error:", error);
    return NextResponse.json(
      { error: "Failed to update user event registration" },
      { status: 500 }
    );
  }
}

