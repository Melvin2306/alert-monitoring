/**
 * Utility functions for sending emails using the API
 */
import type { Finding, SendAlertOptions } from "../types";
import { buildAlertEmail } from "./emailBuilder";
import { sendEmailViaSMTP } from "./smtpService";

/**
 * Format date for email display
 * @param date - The date to format
 * @returns Formatted date string
 */
export function formatDate(date: Date = new Date()): string {
  return date.toLocaleString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    timeZoneName: "short",
  });
}

/**
 * Creates a finding object from detection data
 * @param url - The URL where keywords were found
 * @param keywords - Array of keywords found
 * @param timestamp - Detection timestamp (optional, defaults to now)
 * @param siteName - Optional friendly name for the site
 * @param context - Optional context text around the found keywords
 * @param highlightedContext - Optional HTML-formatted context with highlighted keywords
 * @returns A finding object ready to be used in email templates
 */
export function createFinding(
  url: string,
  keywords: string[],
  timestamp?: Date,
  siteName?: string,
  context?: string,
  highlightedContext?: string
): Finding {
  return {
    url,
    keywords,
    findingTime: formatDate(timestamp || new Date()),
    siteName,
    context,
    highlightedContext,
  };
}

/**
 * Sends an alert email with findings
 * @param options - Configuration options for the email
 * @returns Promise resolving to the API response
 */
export async function sendAlertEmail(
  options: SendAlertOptions
): Promise<{ success: boolean; messageId?: string; message: string }> {
  const {
    subject = "Alert: Darkweb Monitoring Detection",
    recipients,
    cc,
    bcc,
    replyTo,
    priority = "high",
    emailId,
    ...emailBuilderOptions
  } = options;

  // Get email content from builder
  const emailContent = buildAlertEmail({
    ...emailBuilderOptions,
    emailId,
  });

  // Send to each recipient individually
  const results = [];

  for (const email of recipients) {
    try {
      const result = await sendEmailViaSMTP({
        subject,
        html: emailContent.html,
        text: emailContent.text,
        email_address: email,
        cc,
        bcc,
        replyTo,
        priority,
      });

      results.push(result);
    } catch (error) {
      console.error(`Failed to send email to ${email}:`, error);
      throw error;
    }
  }

  // Return the first result (for single recipient) or combined result
  return results.length === 1
    ? results[0]
    : {
        success: true,
        message: `Successfully sent ${results.length} emails`,
      };
}
