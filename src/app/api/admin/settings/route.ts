import { NextRequest, NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// GET - Get app settings
export async function GET() {
  try {
    let settings = await prisma.appSettings.findFirst();

    // Create default settings if none exist
    if (!settings) {
      settings = await prisma.appSettings.create({
        data: {
          votingEnabled: false,
          illusionMode: false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Get settings error:", error);
    return NextResponse.json(
      { error: "Failed to get settings" },
      { status: 500 }
    );
  }
}

// PUT - Update app settings (admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user?.isAdmin) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const updateData: { votingEnabled?: boolean; illusionMode?: boolean } = {};
    
    if (typeof body.votingEnabled === "boolean") {
      updateData.votingEnabled = body.votingEnabled;
    }
    if (typeof body.illusionMode === "boolean") {
      updateData.illusionMode = body.illusionMode;
    }

    // Find existing settings or create new
    let settings = await prisma.appSettings.findFirst();

    if (settings) {
      settings = await prisma.appSettings.update({
        where: { id: settings.id },
        data: updateData,
      });
    } else {
      settings = await prisma.appSettings.create({
        data: {
          votingEnabled: updateData.votingEnabled ?? false,
          illusionMode: updateData.illusionMode ?? false,
        },
      });
    }

    return NextResponse.json(settings);
  } catch (error) {
    console.error("Update settings error:", error);
    return NextResponse.json(
      { error: "Failed to update settings" },
      { status: 500 }
    );
  }
}

