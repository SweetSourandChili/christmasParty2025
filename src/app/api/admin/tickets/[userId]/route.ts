import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// PUT update ticket status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId } = await params;
    const { status } = await request.json();

    if (!["NOT_ACTIVATED", "PAYMENT_PENDING", "ACTIVATED"].includes(status)) {
      return NextResponse.json(
        { error: "Invalid status" },
        { status: 400 }
      );
    }

    // Get user info for logging
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { name: true },
    });

    const ticket = await prisma.ticket.update({
      where: { userId },
      data: { status },
    });

    // Log the action
    await logAction(
      session.user.id,
      "ADMIN_APPROVE_TICKET",
      `Admin changed ticket status to ${status} for ${user?.name || userId}`,
      { targetUserId: userId, targetUserName: user?.name, newStatus: status }
    );

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

