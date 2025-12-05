import { NextRequest, NextResponse } from "next/server";
import prisma from "@/lib/prisma";

// Temporary fixed verification code until email is set up
const TEMP_VERIFICATION_CODE = "520260";

export async function POST(request: NextRequest) {
  try {
    const { email } = await request.json();

    if (!email) {
      return NextResponse.json(
        { error: "Email is required" },
        { status: 400 }
      );
    }

    // Check if user with this email already exists
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    // Store the fixed code in database
    await prisma.verificationCode.create({
      data: {
        email,
        code: TEMP_VERIFICATION_CODE,
        expiresAt,
      },
    });

    return NextResponse.json(
      { message: "Verification code ready" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to process request" },
      { status: 500 }
    );
  }
}
