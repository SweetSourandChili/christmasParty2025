import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";
import { logAction } from "@/lib/serverLogger";

// GET all feedbacks (admin only)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const feedbacks = await prisma.feedback.findMany({
      include: {
        user: {
          select: { id: true, name: true },
        },
      },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(feedbacks);
  } catch (error) {
    console.error("Get feedbacks error:", error);
    return NextResponse.json(
      { error: "Failed to fetch feedbacks" },
      { status: 500 }
    );
  }
}

// POST create feedback
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { content } = await request.json();

    if (!content || content.trim().length === 0) {
      return NextResponse.json(
        { error: "Feedback content is required" },
        { status: 400 }
      );
    }

    const feedback = await prisma.feedback.create({
      data: {
        content: content.trim(),
        userId: session.user.id,
      },
    });

    // Log the action
    await logAction(
      session.user.id,
      "ADD_FEEDBACK",
      `Submitted feedback`,
      { feedbackId: feedback.id }
    );

    return NextResponse.json(feedback, { status: 201 });
  } catch (error) {
    console.error("Create feedback error:", error);
    return NextResponse.json(
      { error: "Failed to submit feedback" },
      { status: 500 }
    );
  }
}

