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

  // Create sample events
  const events = [
    {
      name: "Cocktail Hour",
      description:
        "Enjoy festive cocktails and mocktails while mingling with fellow guests. Live jazz music and holiday appetizers included.",
      price: 25,
    },
    {
      name: "Christmas Market",
      description:
        "Browse handmade gifts, decorations, and delicious treats at our mini market. Perfect for last-minute gift shopping!",
      price: 0,
    },
    {
      name: "Dinner Feast",
      description:
        "A magnificent Christmas dinner with traditional roast turkey, ham, and all the fixings. Vegetarian options available.",
      price: 50,
    },
    {
      name: "After Party",
      description:
        "Dance the night away with DJ Santa spinning holiday hits and club classics until 2 AM!",
      price: 15,
    },
  ];

  for (const eventData of events) {
    const existingEvent = await prisma.event.findFirst({
      where: { name: eventData.name },
    });

    if (!existingEvent) {
      await prisma.event.create({
        data: eventData,
      });
      console.log("🎉 Event created:", eventData.name);
    } else {
      console.log("🎉 Event already exists:", eventData.name);
    }
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
