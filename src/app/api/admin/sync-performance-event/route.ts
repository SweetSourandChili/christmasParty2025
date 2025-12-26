import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// POST - Sync all performance registrants to Performance event
export async function POST() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    // Find the Performance event
    let performanceEvent = await prisma.event.findFirst({
      where: { name: "Performance" },
    });

    if (!performanceEvent) {
      // Create it if doesn't exist
      performanceEvent = await prisma.event.create({
        data: {
          name: "Performance",
          description: "Every performer gets a special gift!",
          price: 0,
          isLocked: true,
          autoJoin: false,
        },
      });
    }

    // Get all users who have registered for any performance
    const performanceRegistrations = await prisma.performanceRegistration.findMany({
      select: {
        userId: true,
      },
    });

    // Also get performance creators
    const performances = await prisma.performance.findMany({
      select: {
        creatorId: true,
      },
    });

    // Combine unique user IDs
    const userIds = new Set<string>();
    performanceRegistrations.forEach((r) => userIds.add(r.userId));
    performances.forEach((p) => userIds.add(p.creatorId));

    let synced = 0;

    for (const userId of userIds) {
      // Upsert the registration
      await prisma.eventRegistration.upsert({
        where: {
          userId_eventId: {
            userId,
            eventId: performanceEvent.id,
          },
        },
        update: {
          joining: true,
        },
        create: {
          userId,
          eventId: performanceEvent.id,
          joining: true,
        },
      });
      synced++;
    }

    // Log the action
    await logAction(
      session.user.id,
      "ADMIN_SYNC_PERFORMANCE_EVENT",
      `Admin synced ${synced} users to Performance event`,
      { syncedCount: synced }
    );

    return NextResponse.json({
      message: `Synced ${synced} users to Performance event`,
      synced,
    });
  } catch (error) {
    console.error("Sync performance event error:", error);
    return NextResponse.json(
      { error: "Failed to sync" },
      { status: 500 }
    );
  }
}

