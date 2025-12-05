import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import prisma from "@/lib/prisma";
import { verifyEmailCode } from "@/lib/email";

export async function POST(request: NextRequest) {
  try {
    const { name, email, phone, password, verificationCode } = await request.json();

    if (!name || !email || !phone || !password || !verificationCode) {
      return NextResponse.json(
        { error: "Name, email, phone, password, and verification code are required" },
        { status: 400 }
      );
    }

    // Verify the email code
    const isValidCode = await verifyEmailCode(email, verificationCode);
    if (!isValidCode) {
      return NextResponse.json(
        { error: "Invalid or expired verification code" },
        { status: 400 }
      );
    }

    // Check if user already exists by email
    const existingUserByEmail = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUserByEmail) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 400 }
      );
    }

    // Check if user already exists by phone
    const existingUserByPhone = await prisma.user.findUnique({
      where: { phone },
    });

    if (existingUserByPhone) {
      return NextResponse.json(
        { error: "User with this phone number already exists" },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user with verified email
    const user = await prisma.user.create({
      data: {
        name,
        email,
        phone,
        password: hashedPassword,
        emailVerified: true,
      },
    });

    // Create ticket for user with NOT_ACTIVATED status
    await prisma.ticket.create({
      data: {
        userId: user.id,
        status: "NOT_ACTIVATED",
      },
    });

    return NextResponse.json(
      { message: "User registered successfully", userId: user.id },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Failed to register user" },
      { status: 500 }
    );
  }
}
