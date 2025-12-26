import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// DELETE an event (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;

    // Get event name before deleting
    const event = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    await prisma.event.delete({
      where: { id: eventId },
    });

    // Log the action
    await logAction(
      session.user.id,
      "ADMIN_DELETE_EVENT",
      `Admin deleted event: ${event?.name || eventId}`,
      { eventId, eventName: event?.name }
    );

    return NextResponse.json({ message: "Event deleted successfully" });
  } catch (error) {
    console.error("Delete event error:", error);
    return NextResponse.json(
      { error: "Failed to delete event" },
      { status: 500 }
    );
  }
}

// PUT update an event (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { id: eventId } = await params;
    const body = await request.json();

    // Build update data with only provided fields
    const updateData: any = {};
    if (body.name !== undefined) updateData.name = body.name;
    if (body.description !== undefined) updateData.description = body.description;
    if (body.price !== undefined) updateData.price = body.price;
    if (body.imageUrl !== undefined) updateData.imageUrl = body.imageUrl;
    if (body.isActive !== undefined) updateData.isActive = body.isActive;
    if (body.isLocked !== undefined) updateData.isLocked = body.isLocked;
    if (body.autoJoin !== undefined) updateData.autoJoin = body.autoJoin;

    // Get event name before updating
    const oldEvent = await prisma.event.findUnique({
      where: { id: eventId },
      select: { name: true },
    });

    const event = await prisma.event.update({
      where: { id: eventId },
      data: updateData,
    });

    // Log the action
    await logAction(
      session.user.id,
      "ADMIN_UPDATE_EVENT",
      `Admin updated event: ${event.name}`,
      { eventId, eventName: event.name, changes: Object.keys(updateData) }
    );

    return NextResponse.json(event);
  } catch (error) {
    console.error("Update event error:", error);
    return NextResponse.json(
      { error: "Failed to update event" },
      { status: 500 }
    );
  }
}
