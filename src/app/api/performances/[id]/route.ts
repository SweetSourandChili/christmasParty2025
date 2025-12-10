import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// PUT - Update a performance (only participants or admin)
export async function PUT(
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
    const { name, description } = await request.json();

    const performance = await prisma.performance.findUnique({
      where: { id: performanceId },
      include: {
        registrations: true,
      },
    });

    if (!performance) {
      return NextResponse.json(
        { error: "Performance not found" },
        { status: 404 }
      );
    }

    // Check if user is a participant (registered) or admin
    const isParticipant = performance.registrations.some(
      (reg) => reg.userId === session.user.id
    );

    if (!isParticipant && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "Only participants can edit this performance" },
        { status: 403 }
      );
    }

    // Validate name
    if (!name || name.trim().length === 0) {
      return NextResponse.json(
        { error: "Performance name is required" },
        { status: 400 }
      );
    }

    const updatedPerformance = await prisma.performance.update({
      where: { id: performanceId },
      data: {
        name: name.trim(),
        description: description?.trim() || null,
      },
    });

    return NextResponse.json(updatedPerformance);
  } catch (error) {
    console.error("Update performance error:", error);
    return NextResponse.json(
      { error: "Failed to update performance" },
      { status: 500 }
    );
  }
}

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

