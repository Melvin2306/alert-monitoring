/**
 * SMTP Email Service
 * Core email sending functionality using nodemailer
 */

import nodemailer from "nodemailer";
import type { EmailSendRequest } from "../types";
import { buildAlertEmail } from "./emailBuilder";
import { formatDate } from "./sendEmail";

// Get SMTP configuration from environment variables
const SMTP_HOST = process.env.SMTP_HOST || "";
const SMTP_PORT = parseInt(process.env.SMTP_PORT || "587", 10);
const SMTP_USER = process.env.SMTP_USER || "";
const SMTP_PASSWORD = process.env.SMTP_PASSWORD || "";
const SMTP_FROM = process.env.SMTP_FROM || "";
const SMTP_SECURE = process.env.SMTP_SECURE === "true";

/**
 * Send an email using SMTP configuration
 * @param options - Email sending options
 * @returns Promise resolving to the sent message info
 */
export async function sendEmailViaSMTP(
  options: EmailSendRequest
): Promise<{ success: boolean; messageId?: string; message: string }> {
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
  } = options;

  // Validate required fields
  if (!subject || (!body && !html && !text && !useTemplate) || !email_address) {
    throw new Error(
      "Subject, content (body, html, text, or template data), and email_address are required"
    );
  }

  // Check if email_address contains valid email string
  if (typeof email_address !== "string" || !email_address.includes("@")) {
    throw new Error(`Invalid email address: ${email_address}`);
  }

  // Check if subject is a non-empty string
  if (typeof subject !== "string" || !subject.trim()) {
    throw new Error("Subject must be a non-empty string");
  }

  // Validate cc array if provided
  if (
    cc &&
    (!Array.isArray(cc) || cc.some((email) => typeof email !== "string" || !email.includes("@")))
  ) {
    throw new Error("cc must be an array of valid email addresses");
  }

  // Validate bcc array if provided
  if (
    bcc &&
    (!Array.isArray(bcc) || bcc.some((email) => typeof email !== "string" || !email.includes("@")))
  ) {
    throw new Error("bcc must be an array of valid email addresses");
  }

  // Validate replyTo if provided
  if (replyTo && (typeof replyTo !== "string" || !replyTo.includes("@"))) {
    throw new Error("replyTo must be a valid email address");
  }

  // Validate priority if provided
  if (priority && !["high", "normal", "low"].includes(priority)) {
    throw new Error("priority must be one of: high, normal, low");
  }

  // Configure nodemailer transporter with SMTP settings
  if (!SMTP_HOST || !SMTP_USER || !SMTP_FROM) {
    throw new Error("SMTP is not configured. Email cannot be sent.");
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

  try {
    // Send email and get result
    const result = await transporter.sendMail(mailOptions);
    console.log("Email sent successfully");

    return {
      success: true,
      message: "Email sent successfully",
      messageId: result.messageId,
    };
  } catch (error) {
    const emailError = error as Error;
    console.error("Error sending email via SMTP:", emailError);
    throw new Error(`SMTP error: ${emailError.message}`);
  }
}
