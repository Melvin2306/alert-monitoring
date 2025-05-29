import type { SMTPStatusResponse } from "@/app/api/lib/types";
import { NextResponse } from "next/server";

/**
 * GET /api/smtp/status
 *
 * Checks the SMTP configuration status by examining environment variables.
 * This endpoint performs server-side validation of SMTP environment variables
 * and returns detailed information about configuration status.
 *
 * Required environment variables:
 * - SMTP_HOST: SMTP server hostname (e.g., smtp.gmail.com)
 * - SMTP_USER: SMTP username/email address
 * - SMTP_PASSWORD: SMTP password or app password
 * - SMTP_FROM: "From" email address for notifications
 *
 * Optional environment variables:
 * - SMTP_PORT: SMTP server port (default: 587)
 * - SMTP_SECURE: Whether to use secure connection (default: false)
 *
 * @returns {SMTPStatusResponse} Configuration status and details
 */
export async function GET() {
  try {
    // Get SMTP environment variables
    const smtp_host = process.env.SMTP_HOST || "";
    const smtp_port = parseInt(process.env.SMTP_PORT || "587", 10);
    const smtp_user = process.env.SMTP_USER || "";
    const smtp_password = process.env.SMTP_PASSWORD || "";
    const smtp_from = process.env.SMTP_FROM || "";
    const smtp_secure = process.env.SMTP_SECURE === "true";

    // Check which variables are missing
    const missingVariables: string[] = [];
    const configuredVariables: string[] = [];

    // Check required variables
    if (!smtp_host) {
      missingVariables.push("SMTP_HOST - Your SMTP server hostname (e.g., smtp.gmail.com)");
    } else {
      configuredVariables.push(`SMTP_HOST: ${smtp_host}`);
    }

    if (!smtp_user) {
      missingVariables.push("SMTP_USER - Your SMTP username/email address");
    } else {
      configuredVariables.push(`SMTP_USER: ${smtp_user}`);
    }

    if (!smtp_password) {
      missingVariables.push("SMTP_PASSWORD - Your SMTP password or app password");
    } else {
      configuredVariables.push("SMTP_PASSWORD: ***configured***");
    }

    if (!smtp_from) {
      missingVariables.push('SMTP_FROM - The "from" email address for notifications');
    } else {
      configuredVariables.push(`SMTP_FROM: ${smtp_from}`);
    }

    // Always show port and secure settings
    configuredVariables.push(`SMTP_PORT: ${smtp_port}`);
    configuredVariables.push(`SMTP_SECURE: ${smtp_secure ? "Enabled" : "Disabled"}`);

    // Configuration is complete if all required variables are set
    const isConfigured = smtp_host && smtp_user && smtp_password && smtp_from;

    const response: SMTPStatusResponse = {
      isConfigured: !!isConfigured,
      smtp_host,
      smtp_port,
      smtp_user,
      smtp_from,
      smtp_secure,
      missingVariables,
      configuredVariables,
    };

    return NextResponse.json(response);
  } catch (error) {
    console.error("Error checking SMTP status:", error);
    return NextResponse.json(
      {
        error: "Failed to check SMTP configuration",
        isConfigured: false,
        missingVariables: ["Unable to check environment variables"],
        configuredVariables: [],
      },
      { status: 500 }
    );
  }
}
