import { PrismaClient } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("🌱 Seeding database...");

  // Check if admin already exists
  const existingAdmin = await prisma.user.findUnique({
    where: { email: "admin@kiki-christmas.com" },
  });

  let admin;
  if (existingAdmin) {
    admin = existingAdmin;
    console.log("👑 Admin user already exists:", admin.name);
  } else {
    // Create admin user
    const adminPassword = await bcrypt.hash("admin123", 12);
    admin = await prisma.user.create({
      data: {
        name: "Admin User",
        email: "admin@kiki-christmas.com",
        phone: "+905551234567",
        password: adminPassword,
        emailVerified: true,
        isAdmin: true,
      },
    });
    console.log("👑 Admin user created:", admin.name);
  }

  // Check if admin has ticket
  const existingTicket = await prisma.ticket.findUnique({
    where: { userId: admin.id },
  });

  if (!existingTicket) {
    await prisma.ticket.create({
      data: {
        userId: admin.id,
        status: "ACTIVATED",
      },
    });
    console.log("🎫 Admin ticket created");
  }

  // Delete old events
  await prisma.eventRegistration.deleteMany({});
  await prisma.event.deleteMany({});
  console.log("🗑️ Old events cleared");

  // Create new events
  const events = [
    {
      name: "Base Expenses",
      description:
        "This includes the market budget for food, drinks, decorations, and all necessary supplies for the party.",
      price: 0, // TBA
    },
    {
      name: "Performance",
      description:
        "Join a performance group and showcase your talent! Every performer receives a special gift 🎁",
      price: 0, // TBA
    },
    {
      name: "Group Alcohol",
      description:
        "Join this event if you want to participate in the group alcohol purchase, or bring your own drinks to the party.",
      price: 0, // TBA
    },
  ];

  for (const eventData of events) {
    await prisma.event.create({
      data: eventData,
    });
    console.log("🎉 Event created:", eventData.name);
  }

  console.log("\n✅ Seeding complete!");
  console.log("\n📝 Admin Login Credentials:");
  console.log("   Phone: +905551234567");
  console.log("   Password: admin123");
}

main()
  .catch((e) => {
    console.error("❌ Seeding failed:", e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
