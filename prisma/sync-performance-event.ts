import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function syncPerformanceEvent() {
  console.log("Starting sync of performance registrations to Performance event...");

  // Find the Performance event
  const performanceEvent = await prisma.event.findFirst({
    where: { name: "Performance" },
  });

  if (!performanceEvent) {
    console.log("Performance event not found. Creating it...");
    const newEvent = await prisma.event.create({
      data: {
        name: "Performance",
        description: "Every performer gets a special gift!",
        price: 0,
        isLocked: true,
        autoJoin: false,
      },
    });
    console.log("Created Performance event:", newEvent.id);
    return syncWithEvent(newEvent.id);
  }

  return syncWithEvent(performanceEvent.id);
}

async function syncWithEvent(eventId: string) {
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

  console.log(`Found ${userIds.size} users with performance registrations`);

  let synced = 0;
  let alreadyJoined = 0;

  for (const userId of userIds) {
    // Check if already registered
    const existing = await prisma.eventRegistration.findUnique({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
    });

    if (existing?.joining) {
      alreadyJoined++;
      continue;
    }

    // Upsert the registration
    await prisma.eventRegistration.upsert({
      where: {
        userId_eventId: {
          userId,
          eventId,
        },
      },
      update: {
        joining: true,
      },
      create: {
        userId,
        eventId,
        joining: true,
      },
    });
    synced++;
  }

  console.log(`Sync complete: ${synced} users added, ${alreadyJoined} already joined`);
}

syncPerformanceEvent()
  .catch((e) => {
    console.error("Sync failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

