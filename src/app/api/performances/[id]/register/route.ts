import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST register to a performance
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

    const { id: performanceId } = await params;

    // Check if performance exists
    const performance = await prisma.performance.findUnique({
      where: { id: performanceId },
      include: {
        registrations: true,
      },
    });

    if (!performance) {
      return NextResponse.json(
        { error: "Performance not found" },
        { status: 404 }
      );
    }

    // Check if already registered
    const existingRegistration = await prisma.performanceRegistration.findUnique({
      where: {
        userId_performanceId: {
          userId: session.user.id,
          performanceId,
        },
      },
    });

    if (existingRegistration) {
      return NextResponse.json(
        { error: "Already registered to this performance" },
        { status: 400 }
      );
    }

    // Check if performance is full
    if (performance.registrations.length >= performance.maxParticipants) {
      return NextResponse.json(
        { error: "Performance is full" },
        { status: 400 }
      );
    }

    // Register user
    const registration = await prisma.performanceRegistration.create({
      data: {
        userId: session.user.id,
        performanceId,
      },
    });

    // Update ticket status to PAYMENT_PENDING
    await prisma.ticket.update({
      where: { userId: session.user.id },
      data: { status: "PAYMENT_PENDING" },
    });

    // Auto-join user to "Performance" event
    const performanceEvent = await prisma.event.findFirst({
      where: { name: "Performance" },
    });

    if (performanceEvent) {
      await prisma.eventRegistration.upsert({
        where: {
          userId_eventId: {
            userId: session.user.id,
            eventId: performanceEvent.id,
          },
        },
        update: {
          joining: true,
        },
        create: {
          userId: session.user.id,
          eventId: performanceEvent.id,
          joining: true,
        },
      });
    }

    return NextResponse.json(registration, { status: 201 });
  } catch (error) {
    console.error("Register to performance error:", error);
    return NextResponse.json(
      { error: "Failed to register to performance" },
      { status: 500 }
    );
  }
}

// DELETE unregister from a performance
export async function DELETE(
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

    const { id: performanceId } = await params;

    // Delete registration
    await prisma.performanceRegistration.delete({
      where: {
        userId_performanceId: {
          userId: session.user.id,
          performanceId,
        },
      },
    });

    // Check if user has any other performance registrations
    const otherRegistrations = await prisma.performanceRegistration.findFirst({
      where: { userId: session.user.id },
    });

    // If no other registrations and ticket is not already activated, revert to NOT_ACTIVATED
    if (!otherRegistrations) {
      const ticket = await prisma.ticket.findUnique({
        where: { userId: session.user.id },
      });

      if (ticket && ticket.status === "PAYMENT_PENDING") {
        await prisma.ticket.update({
          where: { userId: session.user.id },
          data: { status: "NOT_ACTIVATED" },
        });
      }

      // Also remove from "Performance" event if no longer in any performance
      const performanceEvent = await prisma.event.findFirst({
        where: { name: "Performance" },
      });

      if (performanceEvent) {
        await prisma.eventRegistration.upsert({
          where: {
            userId_eventId: {
              userId: session.user.id,
              eventId: performanceEvent.id,
            },
          },
          update: {
            joining: false,
          },
          create: {
            userId: session.user.id,
            eventId: performanceEvent.id,
            joining: false,
          },
        });
      }
    }

    return NextResponse.json({ message: "Unregistered successfully" });
  } catch (error) {
    console.error("Unregister from performance error:", error);
    return NextResponse.json(
      { error: "Failed to unregister from performance" },
      { status: 500 }
    );
  }
}
