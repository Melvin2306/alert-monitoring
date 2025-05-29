/**
 * Test API Route: /api/send-email/test
 *
 * Simplified endpoint for testing email functionality with debug logging
 */

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";

// Get SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";

// Simple test request type
type EmailTestRequest = {
  to: string;
  message: string;
  subject?: string;
};

export async function POST(request: Request) {
  console.log("📧 Email test route called");
  try {
    const body = await request.json();
    console.log("📬 Request body:", JSON.stringify(body, null, 2));

    const { to, message, subject = "Test Email" } = body as EmailTestRequest;

    // Basic validation
    if (!to || !message) {
      console.error("❌ Missing required fields");
      return NextResponse.json(
        { success: false, message: "Both 'to' and 'message' fields are required" },
        { status: 400 }
      );
    }

    // Email address validation
    if (!to.includes("@")) {
      console.error(`❌ Invalid email address: ${to}`);
      return NextResponse.json(
        { success: false, message: "Invalid email address" },
        { status: 400 }
      );
    }

    // Check SMTP configuration
    console.log("🔍 Checking SMTP configuration...");
    if (!SMTP_HOST || !SMTP_USER || !SMTP_FROM) {
      console.error("❌ SMTP configuration is incomplete");
      console.log({
        SMTP_HOST_SET: !!SMTP_HOST,
        SMTP_USER_SET: !!SMTP_USER,
        SMTP_FROM_SET: !!SMTP_FROM,
      });
      return NextResponse.json(
        { success: false, message: "SMTP is not configured properly" },
        { status: 500 }
      );
    }

    console.log("⚙️ SMTP Configuration:");
    console.log(`- Host: ${SMTP_HOST}`);
    console.log(`- Port: ${SMTP_PORT}`);
    console.log(`- Secure: ${SMTP_SECURE}`);
    console.log(`- From: ${SMTP_FROM}`);

    // Create nodemailer transporter
    console.log("🔄 Creating mail transporter...");
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
      debug: true, // Enable debug logs
    });

    // Build mail options
    console.log("📝 Preparing mail options...");
    const mailOptions: nodemailer.SendMailOptions = {
      from: SMTP_FROM,
      to,
      subject,
      text: message,
    };

    console.log(
      "📤 Sending email with options:",
      JSON.stringify({
        to,
        subject,
        messageLength: message.length,
      })
    );

    // Send email and get result
    console.log("🚀 Attempting to send email...");
    const result = await transporter.sendMail(mailOptions);

    console.log("✅ Email sent successfully");
    console.log("📊 SMTP Response:", result.response);
    console.log("🆔 Message ID:", result.messageId);

    return NextResponse.json(
      {
        success: true,
        message: "Email sent successfully",
        messageId: result.messageId,
        response: result.response,
      },
      { status: 200 }
    );
  } catch (error) {
    const emailError = error as Error;
    console.error("❌ Error sending test email:", emailError);
    console.error("Error stack:", emailError.stack);

    return NextResponse.json(
      {
        success: false,
        message: `Failed to send email: ${emailError.message}`,
        error: emailError.stack,
      },
      { status: 500 }
    );
  }
}
