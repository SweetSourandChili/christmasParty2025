import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

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

    const ticket = await prisma.ticket.update({
      where: { userId },
      data: { status },
    });

    return NextResponse.json(ticket);
  } catch (error) {
    console.error("Update ticket error:", error);
    return NextResponse.json(
      { error: "Failed to update ticket" },
      { status: 500 }
    );
  }
}

