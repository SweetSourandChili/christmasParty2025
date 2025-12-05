import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET current user's ticket
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { userId: session.user.id },
      include: {
        user: {
          include: {
            registrations: {
              include: {
                performance: true,
              },
            },
            eventRegistrations: {
              include: {
                event: true,
              },
            },
          },
        },
      },
    });

    if (!ticket) {
      // Create ticket if it doesn't exist
      const newTicket = await prisma.ticket.create({
        data: {
          userId: session.user.id,
          status: "NOT_ACTIVATED",
        },
      });
      return NextResponse.json(newTicket);
    }

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Get ticket error:", error);
    return NextResponse.json(
      { error: "Failed to fetch ticket" },
      { status: 500 }
    );
  }
}

