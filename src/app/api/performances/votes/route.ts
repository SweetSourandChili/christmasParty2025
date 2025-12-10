import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get all performances with vote stats (for leaderboard)
export async function GET() {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check if voting is enabled or user is admin
    const settings = await prisma.appSettings.findFirst();
    const canViewVotes = session.user.isAdmin || settings?.votingEnabled;

    if (!canViewVotes) {
      return NextResponse.json(
        { error: "Voting is not open yet" },
        { status: 403 }
      );
    }

    const performances = await prisma.performance.findMany({
      include: {
        creator: {
          select: { id: true, name: true },
        },
        registrations: {
          include: {
            user: {
              select: { id: true, name: true },
            },
          },
        },
        votes: true,
      },
    });

    // Calculate vote stats for each performance
    const performancesWithStats = performances.map((perf) => {
      const totalPoints = perf.votes.reduce((sum, v) => sum + v.points, 0);
      const voteCount = perf.votes.length;
      const averagePoints = voteCount > 0 ? totalPoints / voteCount : 0;
      const userVote = perf.votes.find((v) => v.userId === session.user.id);

      // Check if user is participant
      const isParticipant =
        perf.creatorId === session.user.id ||
        perf.registrations.some((r) => r.userId === session.user.id);

      return {
        id: perf.id,
        name: perf.name,
        description: perf.description,
        creator: perf.creator,
        participants: perf.registrations.map((r) => r.user),
        totalPoints,
        voteCount,
        averagePoints: Math.round(averagePoints * 10) / 10,
        userVote: userVote?.points || null,
        isParticipant,
      };
    });

    // Sort by total points descending
    performancesWithStats.sort((a, b) => b.totalPoints - a.totalPoints);

    return NextResponse.json(performancesWithStats);
  } catch (error) {
    console.error("Get performance votes error:", error);
    return NextResponse.json(
      { error: "Failed to get performance votes" },
      { status: 500 }
    );
  }
}

