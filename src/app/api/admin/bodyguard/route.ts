import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// POST - Toggle bodyguard status for a user (admin only)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.isAdmin) {
      return NextResponse.json(
        { error: "Admin access required" },
        { status: 403 }
      );
    }

    const { userId, isBodyguard } = await request.json();

    if (!userId) {
      return NextResponse.json(
        { error: "User ID is required" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: userId },
      data: { isBodyguard: isBodyguard },
      select: { id: true, name: true, isBodyguard: true },
    });

    return NextResponse.json(user);
  } catch (error) {
    console.error("Toggle bodyguard error:", error);
    return NextResponse.json(
      { error: "Failed to update bodyguard status" },
      { status: 500 }
    );
  }
}

