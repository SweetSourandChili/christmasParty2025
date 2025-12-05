import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST join/update event registration
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: eventId } = await params;
    const { joining } = await request.json();

    // Check if event exists
    const event = await prisma.event.findUnique({
      where: { id: eventId },
    });

    if (!event) {
      return NextResponse.json(
        { error: "Event not found" },
        { status: 404 }
      );
    }

    // Check if event is locked (users cannot change their choice)
    if (event.isLocked) {
      return NextResponse.json(
        { error: "This event cannot be changed" },
        { status: 403 }
      );
    }

    // Upsert event registration
    const registration = await prisma.eventRegistration.upsert({
      where: {
        userId_eventId: {
          userId: session.user.id,
          eventId,
        },
      },
      update: {
        joining,
      },
      create: {
        userId: session.user.id,
        eventId,
        joining,
      },
    });

    return NextResponse.json(registration);
  } catch (error) {
    console.error("Join event error:", error);
    return NextResponse.json(
      { error: "Failed to update event registration" },
      { status: 500 }
    );
  }
}
