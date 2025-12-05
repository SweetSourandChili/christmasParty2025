import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET admin stats
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const [
      totalUsers,
      totalPerformances,
      totalEvents,
      activatedTickets,
      pendingTickets,
      notActivatedTickets,
    ] = await Promise.all([
      prisma.user.count(),
      prisma.performance.count(),
      prisma.event.count(),
      prisma.ticket.count({ where: { status: "ACTIVATED" } }),
      prisma.ticket.count({ where: { status: "PAYMENT_PENDING" } }),
      prisma.ticket.count({ where: { status: "NOT_ACTIVATED" } }),
    ]);

    return NextResponse.json({
      totalUsers,
      totalPerformances,
      totalEvents,
      tickets: {
        activated: activatedTickets,
        pending: pendingTickets,
        notActivated: notActivatedTickets,
      },
    });
  } catch (error) {
    console.error("Get stats error:", error);
    return NextResponse.json(
      { error: "Failed to fetch stats" },
      { status: 500 }
    );
  }
}

