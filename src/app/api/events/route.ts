import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// GET all events
export async function GET() {
  try {
    const events = await prisma.event.findMany({
      where: { isActive: true },
      include: {
        registrations: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(events);
  } catch (error) {
    console.error("Get events error:", error);
    return NextResponse.json(
      { error: "Failed to fetch events" },
      { status: 500 }
    );
  }
}

// POST create new event (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { name, description, price, imageUrl, isLocked, autoJoin } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Event name is required" },
        { status: 400 }
      );
    }

    const event = await prisma.event.create({
      data: {
        name,
        description: description || null,
        price: price || 0,
        imageUrl: imageUrl || null,
        isLocked: isLocked || false,
        autoJoin: autoJoin || false,
      },
    });

    // Log the action
    await logAction(
      session.user.id,
      "ADMIN_CREATE_EVENT",
      `Admin created event: ${name}`,
      { eventId: event.id, eventName: name, price }
    );

    return NextResponse.json(event, { status: 201 });
  } catch (error) {
    console.error("Create event error:", error);
    return NextResponse.json(
      { error: "Failed to create event" },
      { status: 500 }
    );
  }
}
