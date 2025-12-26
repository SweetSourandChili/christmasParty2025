import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// POST - Verify ticket by ID (bodyguard or admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isBodyguard && !session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Bodyguard or admin access required" },
        { status: 403 }
      );
    }

    const { ticketId } = await request.json();

    if (!ticketId) {
      return NextResponse.json(
        { error: "Ticket ID is required" },
        { status: 400 }
      );
    }

    const ticket = await prisma.ticket.findUnique({
      where: { id: ticketId },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            phone: true,
          },
        },
      },
    });

    if (!ticket) {
      return NextResponse.json(
        { 
          valid: false, 
          error: "Ticket not found",
          status: "INVALID"
        },
        { status: 404 }
      );
    }

    const isActivated = ticket.status === "ACTIVATED";

    // Log the verification action
    await logAction(
      session.user.id,
      "VERIFY_TICKET",
      `${isActivated ? "Verified" : "Denied"} ticket for ${ticket.user.name}`,
      { ticketId, ticketStatus: ticket.status, ticketUserId: ticket.user.id, ticketUserName: ticket.user.name }
    );

    return NextResponse.json({
      valid: isActivated,
      ticket: {
        id: ticket.id,
        status: ticket.status,
        user: ticket.user,
      },
      message: isActivated 
        ? "✅ Ticket is ACTIVATED - Entry allowed!" 
        : `⚠️ Ticket is ${ticket.status} - Entry NOT allowed`,
    });
  } catch (error) {
    console.error("Verify ticket error:", error);
    return NextResponse.json(
      { error: "Failed to verify ticket" },
      { status: 500 }
    );
  }
}

