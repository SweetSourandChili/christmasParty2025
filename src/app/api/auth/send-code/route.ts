import { NextRequest, NextResponse } from "next/server";
import { sendVerificationEmail } from "@/lib/email";
import prisma from "@/lib/prisma";

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

    // Send verification code
    const sent = await sendVerificationEmail(email);

    if (!sent) {
      return NextResponse.json(
        { error: "Failed to send verification code" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { message: "Verification code sent successfully" },
      { status: 200 }
    );
  } catch (error) {
    console.error("Send code error:", error);
    return NextResponse.json(
      { error: "Failed to send verification code" },
      { status: 500 }
    );
  }
}
