import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET all performances
export async function GET() {
  try {
    const performances = await prisma.performance.findMany({
      include: {
        creator: {
          select: { id: true, name: true },
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(performances);
  } catch (error) {
    console.error("Get performances error:", error);
    return NextResponse.json(
      { error: "Failed to fetch performances" },
      { status: 500 }
    );
  }
}

// POST create new performance
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { name, description, maxParticipants } = await request.json();

    if (!name) {
      return NextResponse.json(
        { error: "Performance name is required" },
        { status: 400 }
      );
    }

    // Create performance
    const performance = await prisma.performance.create({
      data: {
        name,
        description: description || null,
        maxParticipants: maxParticipants || 3,
        creatorId: session.user.id,
      },
    });

    // Auto-register creator to their own performance
    await prisma.performanceRegistration.create({
      data: {
        userId: session.user.id,
        performanceId: performance.id,
      },
    });

    // Update ticket status to PAYMENT_PENDING
    await prisma.ticket.update({
      where: { userId: session.user.id },
      data: { status: "PAYMENT_PENDING" },
    });

    // Auto-join creator to "Performance" event
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

    return NextResponse.json(performance, { status: 201 });
  } catch (error) {
    console.error("Create performance error:", error);
    return NextResponse.json(
      { error: "Failed to create performance" },
      { status: 500 }
    );
  }
}

