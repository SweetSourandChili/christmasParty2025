import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// DELETE a performance (only creator or admin)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { id: performanceId } = await params;

    const performance = await prisma.performance.findUnique({
      where: { id: performanceId },
    });

    if (!performance) {
      return NextResponse.json(
        { error: "Performance not found" },
        { status: 404 }
      );
    }

    // Only creator or admin can delete
    if (performance.creatorId !== session.user.id && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Not authorized to delete this performance" },
        { status: 403 }
      );
    }

    await prisma.performance.delete({
      where: { id: performanceId },
    });

    return NextResponse.json({ message: "Performance deleted successfully" });
  } catch (error) {
    console.error("Delete performance error:", error);
    return NextResponse.json(
      { error: "Failed to delete performance" },
      { status: 500 }
    );
  }
}

