import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// POST - Vote for a performance
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const { points } = await request.json();

    // Check if voting is enabled (admin can always vote)
    if (!session.user.isAdmin) {
      const settings = await prisma.appSettings.findFirst();
      if (!settings?.votingEnabled) {
        return NextResponse.json(
          { error: "Voting is not open yet" },
          { status: 403 }
        );
      }
    }

    // Validate points
    if (!points || points < 1 || points > 10) {
      return NextResponse.json(
        { error: "Points must be between 1 and 10" },
        { status: 400 }
      );
    }

    // Check if performance exists
    const performance = await prisma.performance.findUnique({
      where: { id },
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

    // Users cannot vote for their own performance
    const isParticipant = performance.registrations.some(
      (r) => r.userId === session.user.id
    ) || performance.creatorId === session.user.id;

    if (isParticipant && !session.user.isAdmin) {
      return NextResponse.json(
        { error: "You cannot vote for your own performance" },
        { status: 403 }
      );
    }

    // Upsert vote (update if exists, create if not)
    const vote = await prisma.performanceVote.upsert({
      where: {
        userId_performanceId: {
          userId: session.user.id,
          performanceId: id,
        },
      },
      update: {
        points,
      },
      create: {
        userId: session.user.id,
        performanceId: id,
        points,
      },
    });

    return NextResponse.json(vote);
  } catch (error) {
    console.error("Vote error:", error);
    return NextResponse.json(
      { error: "Failed to submit vote" },
      { status: 500 }
    );
  }
}

// GET - Get votes for a performance
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Get all votes and calculate stats
    const votes = await prisma.performanceVote.findMany({
      where: { performanceId: id },
    });

    const totalPoints = votes.reduce((sum, v) => sum + v.points, 0);
    const voteCount = votes.length;
    const averagePoints = voteCount > 0 ? totalPoints / voteCount : 0;

    // Get user's vote if exists
    const userVote = votes.find((v) => v.userId === session.user.id);

    return NextResponse.json({
      totalPoints,
      voteCount,
      averagePoints: Math.round(averagePoints * 10) / 10,
      userVote: userVote?.points || null,
    });
  } catch (error) {
    console.error("Get votes error:", error);
    return NextResponse.json(
      { error: "Failed to get votes" },
      { status: 500 }
    );
  }
}

