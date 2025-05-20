/**
 * API Route: /api/send-email
 *
 * Handles sending emails to subscribers using SMTP configuration from environment variables
 * Supports both direct email sending and templated emails for ransomware monitoring alerts
 */

import { NextResponse } from "next/server";
import nodemailer from "nodemailer";
// Import email utilities
import { buildAlertEmail } from "../lib/email/emailBuilder";
import { formatDate } from "../lib/email/sendEmail";

// Regular email request type
type EmailRequest = {
  subject: string;
  body?: string; // Legacy field for backward compatibility
  html?: string; // HTML version of the message
  text?: string; // Plain text version of the message
  email_address: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  priority?: "high" | "normal" | "low";
  attachments?: Array<{
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    cid?: string;
  }>;
  headers?: Record<string, string> | Array<{ key: string; value: string }>;
  // New fields for template-based emails
  useTemplate?: boolean;
  templateData?: {
    email?: string;
    findings?: Array<{
      url: string;
      keywords: string[];
      timestamp?: string;
      siteName?: string;
    }>;
  };
};

// Get SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";

export async function POST(request: Request) {
  try {
    const {
      subject,
      body,
      html,
      text,
      email_address,
      cc,
      bcc,
      replyTo,
      priority,
      attachments,
      headers,
      useTemplate,
      templateData,
    }: EmailRequest = await request.json();

    // Ensure the request body is in JSON format
    if (!request.headers.get("Content-Type")?.includes("application/json")) {
      return NextResponse.json(
        { success: false, message: "Content-Type must be application/json" },
        { status: 400 }
      );
    }

    // Check if required fields are present
    if (!subject || (!body && !html && !text && !useTemplate) || !email_address) {
      return NextResponse.json(
        {
          success: false,
          message:
            "Subject, content (body, html, text, or template data), and email_addresses are required",
        },
        { status: 400 }
      );
    }

    // Check if email_addresses contains valid email strings
    if (typeof email_address !== "string" || !email_address.includes("@")) {
      return NextResponse.json(
        { success: false, message: `Invalid email address: ${email_address}` },
        { status: 400 }
      );
    }

    // Check if subject is a non-empty string
    if (typeof subject !== "string" || !subject.trim()) {
      return NextResponse.json(
        { success: false, message: "Subject must be a non-empty string" },
        { status: 400 }
      );
    }

    // Validate cc array if provided
    if (
      cc &&
      (!Array.isArray(cc) || cc.some((email) => typeof email !== "string" || !email.includes("@")))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "cc must be an array of valid email addresses",
        },
        { status: 400 }
      );
    }

    // Validate bcc array if provided
    if (
      bcc &&
      (!Array.isArray(bcc) ||
        bcc.some((email) => typeof email !== "string" || !email.includes("@")))
    ) {
      return NextResponse.json(
        {
          success: false,
          message: "bcc must be an array of valid email addresses",
        },
        { status: 400 }
      );
    }

    // Validate replyTo if provided
    if (replyTo && (typeof replyTo !== "string" || !replyTo.includes("@"))) {
      return NextResponse.json(
        { success: false, message: "replyTo must be a valid email address" },
        { status: 400 }
      );
    }

    // Validate priority if provided
    if (priority && !["high", "normal", "low"].includes(priority)) {
      return NextResponse.json(
        {
          success: false,
          message: "priority must be one of: high, normal, low",
        },
        { status: 400 }
      );
    }

    // Configure nodemailer transporter with SMTP settings
    if (!SMTP_HOST || !SMTP_USER || !SMTP_FROM) {
      console.error("SMTP configuration is incomplete");
      return NextResponse.json(
        {
          success: false,
          message: "SMTP is not configured. Email cannot be sent.",
        },
        { status: 500 }
      );
    }

    // Create nodemailer transporter
    const transporter = nodemailer.createTransport({
      host: SMTP_HOST,
      port: SMTP_PORT,
      secure: SMTP_SECURE,
      auth: {
        user: SMTP_USER,
        pass: SMTP_PASSWORD,
      },
    });

    try {
      // Variables for email content
      let emailHtml = html;
      let emailText = text;

      // Handle template-based emails if requested
      if (useTemplate && templateData) {
        const { email: templateEmail, findings = [] } = templateData;

        // Transform findings data to the format expected by buildAlertEmail
        const transformedFindings = findings.map((finding) => ({
          url: finding.url,
          keywords: finding.keywords,
          findingTime: finding.timestamp || formatDate(new Date()),
          siteName: finding.siteName,
        }));

        // Build email content from templates
        const emailContent = buildAlertEmail({
          email: templateEmail || email_address,
          findings: transformedFindings,
        });

        // Use the generated content
        emailHtml = emailContent.html;
        emailText = emailContent.text;
      }

      // Build mail options object for the single recipient
      const mailOptions: nodemailer.SendMailOptions = {
        from: SMTP_FROM,
        to: email_address,
        subject: subject,
      };

      // Handle content - prioritize explicit html/text fields over legacy body field
      if (emailHtml) {
        mailOptions.html = emailHtml;
      } else if (body) {
        // For backward compatibility
        mailOptions.html = body;
      }

      if (emailText) {
        mailOptions.text = emailText;
      } else if (body && !emailHtml) {
        // Generate plain text from html body as fallback
        mailOptions.text = body.replace(/<[^>]*>/g, "");
      }

      // Add optional fields if provided
      if (cc && cc.length > 0) {
        mailOptions.cc = cc;
      }

      if (bcc && bcc.length > 0) {
        mailOptions.bcc = bcc;
      }

      if (replyTo) {
        mailOptions.replyTo = replyTo;
      }

      if (priority) {
        mailOptions.priority = priority;
      }

      if (attachments && attachments.length > 0) {
        mailOptions.attachments = attachments;
      }

      if (headers) {
        mailOptions.headers = headers;
      }

      // Send email and get result
      const result = await transporter.sendMail(mailOptions);

      console.log("Email sent successfully");

      return NextResponse.json(
        {
          success: true,
          message: "Email sent successfully",
          messageId: result.messageId,
        },
        { status: 200 }
      );
    } catch (error) {
      const emailError = error as Error;
      console.error("Error sending email via SMTP:", emailError);
      return NextResponse.json(
        { success: false, message: `SMTP error: ${emailError.message}` },
        { status: 500 }
      );
    }
  } catch (error) {
    console.error("Error sending email:", error);
    return NextResponse.json({ success: false, message: "Failed to send email" }, { status: 500 });
  }
}
