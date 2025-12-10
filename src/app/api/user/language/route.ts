import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import prisma from "@/lib/prisma";

// GET user's language preference
export async function GET() {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { language: "tr" }, // Default to Turkish for unauthenticated users
        { status: 200 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { language: true },
    });

    return NextResponse.json({ language: user?.language || "tr" });
  } catch (error) {
    console.error("Get language error:", error);
    return NextResponse.json(
      { language: "tr" },
      { status: 200 }
    );
  }
}

// PUT update user's language preference
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: "Unauthorized" },
        { status: 401 }
      );
    }

    const { language } = await request.json();

    // Validate language
    if (!language || !["en", "tr"].includes(language)) {
      return NextResponse.json(
        { error: "Invalid language" },
        { status: 400 }
      );
    }

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: { language },
      select: { language: true },
    });

    return NextResponse.json({ language: user.language });
  } catch (error) {
    console.error("Update language error:", error);
    return NextResponse.json(
      { error: "Failed to update language" },
      { status: 500 }
    );
  }
}

