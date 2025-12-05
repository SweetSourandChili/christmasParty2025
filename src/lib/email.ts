// Email Service - Production ready with Resend
import prisma from "./prisma";

export async function generateVerificationCode(): Promise<string> {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function sendVerificationEmail(email: string): Promise<boolean> {
  const code = await generateVerificationCode();
  const expiresAt = new Date(Date.now() + 15 * 60 * 1000); // 15 minutes

  // Store the code in database
  await prisma.verificationCode.create({
    data: {
      email,
      code,
      expiresAt,
    },
  });

  // In development mode, just log the code
  if (process.env.NODE_ENV === "development" && !process.env.RESEND_API_KEY) {
    console.log(`\n📧 Email Verification Code for ${email}: ${code}\n`);
    return true;
  }

  // Production: Use Resend
  if (process.env.RESEND_API_KEY) {
    try {
      const response = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${process.env.RESEND_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from: process.env.EMAIL_FROM || "KIKI Christmas Event <onboarding@resend.dev>",
          to: [email],
          subject: "🎄 Verify your KIKI Christmas Event account",
          html: `
            <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; background: linear-gradient(135deg, #1a472a 0%, #0d2818 100%); border-radius: 16px;">
              <div style="text-align: center; margin-bottom: 30px;">
                <h1 style="color: #ffd700; font-size: 28px; margin: 0;">🎄 KIKI Christmas Event</h1>
              </div>
              
              <div style="background: rgba(255,255,255,0.1); padding: 30px; border-radius: 12px; text-align: center;">
                <p style="color: #fff; font-size: 18px; margin: 0 0 20px 0;">Your verification code is:</p>
                
                <div style="background: #0a1f12; padding: 20px 40px; border-radius: 8px; display: inline-block; margin: 10px 0;">
                  <span style="font-size: 36px; font-weight: bold; letter-spacing: 8px; color: #ffd700; font-family: monospace;">${code}</span>
                </div>
                
                <p style="color: #aaa; font-size: 14px; margin: 20px 0 0 0;">This code expires in 15 minutes.</p>
              </div>
              
              <p style="color: #888; font-size: 12px; text-align: center; margin-top: 30px;">
                If you didn't request this code, please ignore this email.
              </p>
            </div>
          `,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        console.error("Resend API error:", error);
        return false;
      }

      return true;
    } catch (error) {
      console.error("Failed to send email:", error);
      return false;
    }
  }

  // Fallback: Just log
  console.log(`📧 Verification code for ${email}: ${code}`);
  return true;
}

export async function verifyEmailCode(
  email: string,
  code: string
): Promise<boolean> {
  const validCode = await prisma.verificationCode.findFirst({
    where: {
      email,
      code,
      used: false,
      expiresAt: { gt: new Date() },
    },
  });

  if (validCode) {
    // Mark code as used
    await prisma.verificationCode.update({
      where: { id: validCode.id },
      data: { used: true },
    });
    return true;
  }

  return false;
}
