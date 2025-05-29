/**
 * API Route: /api/alert/send-email
 *
 * Sends email alerts about detected keyword matches to all registered email addresses.
 * This endpoint integrates with the alert/check API to retrieve matches
 * and then sends emails using the email service.
 */

import { getApiKeyOrErrorResponse } from "@/app/api/lib/changeDetection";
import pool from "@/app/api/lib/db";
import { createFinding, sendAlertEmail } from "@/app/api/lib/email/sendEmail";
import type { SendEmailRequest, WatchMatch } from "@/app/api/lib/types";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler to send emails about keyword matches to all registered email addresses
 *
 * This function:
 * 1. Checks for keyword matches using the alert/check API
 * 2. Retrieves all email addresses from the database
 * 3. Sends emails to all addresses with details about the matches
 *
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with the results
 */
export async function GET(req: NextRequest) {
  try {
    console.log("📧 GET /api/alert/send-email: Starting request processing");

    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const checkRecent = searchParams.has("recent") ? searchParams.get("recent") === "1" : true;
    const hours = parseInt(searchParams.get("hours") || "24");
    const testMode = searchParams.get("test") === "1";
    const testEmail = searchParams.get("email") || null;

    console.log("📧 Parameters:", {
      checkRecent,
      hours,
      testMode,
      testEmail,
      headers: Object.fromEntries([...req.headers]),
    });

    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 720) {
      return NextResponse.json(
        { message: "Hours parameter must be between 1 and 720" },
        { status: 400 }
      );
    }

    // Validate test email if in test mode
    if (testMode && testEmail && !testEmail.includes("@")) {
      return NextResponse.json({ message: "Invalid email format for test email" }, { status: 400 });
    }

    // Step 1: Call the alert/check API to get matches
    let alertCheckUrl = `${req.nextUrl.origin}/api/alert/check?`;
    if (checkRecent) {
      alertCheckUrl += "recent=1&";
    }
    alertCheckUrl += `hours=${hours}`;

    console.log("📧 Calling alert/check API:", alertCheckUrl);

    // Get API key from header or environment using the utility function
    const apiKeyOrError = getApiKeyOrErrorResponse(req);
    if (apiKeyOrError instanceof NextResponse) {
      console.log("📧 API key error:", apiKeyOrError.status);
      return apiKeyOrError;
    }
    const apiKey = apiKeyOrError;
    console.log("📧 API key retrieved successfully");

    const checkResponse = await fetch(alertCheckUrl, {
      headers: {
        "x-api-key": apiKey,
      },
    });

    if (!checkResponse.ok) {
      console.log(
        "📧 Alert check API error:",
        checkResponse.status,
        await checkResponse.text().catch(() => "No response text")
      );
      return NextResponse.json(
        { message: "Failed to check for keyword matches" },
        { status: checkResponse.status }
      );
    }

    const checkData = await checkResponse.json();
    const matches: WatchMatch[] = checkData.matches || [];
    console.log(`📧 Retrieved ${matches.length} matches from alert/check API`);

    // If no matches, return early
    if (matches.length === 0) {
      console.log("📧 No matches found, no emails will be sent");
      return NextResponse.json({ message: "No matches found, no emails sent" }, { status: 200 });
    }

    // Step 2: Get all email addresses from the database
    let emailAddresses: string[] = [];

    if (testMode && testEmail) {
      // In test mode, only send to the specified email
      emailAddresses = [testEmail];
      console.log(`📧 Test mode: Only sending to ${testEmail}`);
    } else {
      try {
        const emailResult = await pool.query(
          "SELECT email_address FROM email ORDER BY email_address"
        );

        emailAddresses = emailResult.rows.map((row) => row.email_address);

        if (emailAddresses.length === 0) {
          return NextResponse.json(
            { message: "No email addresses found in database" },
            { status: 404 }
          );
        }
      } catch (dbError) {
        console.error("Database error fetching email addresses:", dbError);
        return NextResponse.json(
          { message: "Failed to fetch email addresses from database" },
          { status: 500 }
        );
      }
    }

    // Step 3: Convert matches to findings format for email
    const findings = matches.map((match) => {
      // Convert keywords array to string array for createFinding
      const keywordStrings = match.keywords.map((k) => k.keyword);

      // Get context from the first keyword match (or combine if multiple)
      let combinedContext = "";
      let combinedHighlightedContext = "";

      if (match.keywords.length > 0) {
        // If there's just one keyword, use its context directly
        if (match.keywords.length === 1) {
          combinedContext = match.keywords[0].context || "";
          combinedHighlightedContext = match.keywords[0].highlightedContext || "";
        } else {
          // For multiple keywords, combine contexts with separators
          combinedContext = match.keywords
            .filter((k) => k.context)
            .map((k) => `"${k.keyword}": ${k.context}`)
            .join("\n\n");

          combinedHighlightedContext = match.keywords
            .filter((k) => k.highlightedContext || k.context)
            .map((k) => {
              const keywordHtml = `<strong>"${k.keyword}"</strong>`;
              const contentHtml = k.highlightedContext || k.context || "";
              return `<div style="margin-bottom: 8px;">${keywordHtml}: ${contentHtml}</div>`;
            })
            .join("");
        }
      }

      // Create timestamp from lastChanged or current time
      const timestamp = match.lastChanged ? new Date(match.lastChanged) : new Date();

      return createFinding(
        match.url,
        keywordStrings,
        timestamp,
        match.title,
        combinedContext,
        combinedHighlightedContext
      );
    });

    // Step 4: Send emails
    const emailPromises = emailAddresses.map(async (email) => {
      try {
        console.log(`Sending email alert to ${email} with ${findings.length} findings`);
        await sendAlertEmail({
          subject: `Alert: ${matches.length} Keyword Matches Detected`,
          recipients: [email],
          findings,
          priority: "high",
          email, // Pass email for personalization in template
        });
        return { email, success: true };
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        return { email, success: false, error: String(error) };
      }
    });

    // Use allSettled to ensure all promises complete regardless of failures
    const emailResults = await Promise.allSettled(
      emailPromises.map((p) =>
        p.catch((e) => {
          console.error("Email promise rejection:", e);
          return { success: false, error: String(e) };
        })
      )
    );

    // Process results from allSettled
    const processedResults = emailResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          email: emailAddresses[index],
          success: false,
          error: result.reason ? String(result.reason) : "Unknown error",
        };
      }
    });

    // Count successes and failures
    const successCount = processedResults.filter((r) => r.success).length;
    const failureCount = processedResults.length - successCount;

    console.log(`📧 Email sending complete: ${successCount} succeeded, ${failureCount} failed`);
    if (failureCount > 0) {
      const failedEmails = processedResults.filter((r) => !r.success);
      console.log(
        "📧 Failed emails:",
        failedEmails.map((f) => ({
          email: "email" in f ? f.email : "unknown",
          error: f.error?.substring(0, 100) + (f.error && f.error.length > 100 ? "..." : ""),
        }))
      );
    }

    // Return results
    return NextResponse.json(
      {
        message: `Email alerts sent for ${matches.length} URL matches`,
        emailsSent: successCount,
        emailsFailed: failureCount,
        totalEmails: emailAddresses.length,
        testMode,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error sending email alerts:", error);
    return NextResponse.json(
      { message: "Failed to send email alerts", error: String(error) },
      { status: 500 }
    );
  }
}

/**
 * POST handler to manually trigger sending email alerts
 * Allows providing specific parameters and even pre-defined matches
 *
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with the results
 */
export async function POST(req: NextRequest) {
  try {
    console.log("📧 POST /api/alert/send-email: Starting request processing");

    // Ensure request body is JSON
    if (!req.headers.get("Content-Type")?.includes("application/json")) {
      console.log("📧 Invalid content type:", req.headers.get("Content-Type"));
      return NextResponse.json({ message: "Request body must be JSON" }, { status: 400 });
    }

    // Parse request body
    const {
      matches: providedMatches,
      checkRecent = true,
      hours = 24,
      testMode = false,
      testEmail = "",
      customSubject = "",
    }: SendEmailRequest = await req.json();

    console.log("📧 Parameters:", {
      providedMatches: providedMatches
        ? `${providedMatches.length} matches provided`
        : "No matches provided",
      checkRecent,
      hours,
      testMode,
      testEmail,
      customSubject: customSubject ? "Custom subject provided" : "Using default subject",
      headers: Object.fromEntries([...req.headers]),
    });

    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 720) {
      return NextResponse.json(
        { message: "Hours parameter must be between 1 and 720" },
        { status: 400 }
      );
    }

    // Validate test email if in test mode
    if (testMode && testEmail && !testEmail.includes("@")) {
      return NextResponse.json({ message: "Invalid email format for test email" }, { status: 400 });
    }

    // Get API key from header or environment using the utility function
    const apiKeyOrError = getApiKeyOrErrorResponse(req);
    if (apiKeyOrError instanceof NextResponse) {
      console.log("📧 API key error:", apiKeyOrError.status);
      return apiKeyOrError;
    }
    const apiKey = apiKeyOrError;
    console.log("📧 API key retrieved successfully");

    // If matches not provided, fetch them using the alert/check API
    let matches: WatchMatch[] = providedMatches || [];

    if (!providedMatches) {
      let alertCheckUrl = `${req.nextUrl.origin}/api/alert/check?`;
      if (checkRecent) {
        alertCheckUrl += "recent=1&";
      }
      alertCheckUrl += `hours=${hours}`;

      console.log("📧 Calling alert/check API:", alertCheckUrl);
      const checkResponse = await fetch(alertCheckUrl, {
        headers: {
          "x-api-key": apiKey,
        },
      });

      if (!checkResponse.ok) {
        console.log(
          "📧 Alert check API error:",
          checkResponse.status,
          await checkResponse.text().catch(() => "No response text")
        );
        return NextResponse.json(
          { message: "Failed to check for keyword matches" },
          { status: checkResponse.status }
        );
      }

      const checkData = await checkResponse.json();
      matches = checkData.matches || [];
      console.log(`📧 Retrieved ${matches.length} matches from alert/check API`);
    } else {
      console.log(`📧 Using ${matches.length} pre-defined matches from request body`);
    }

    // If no matches, return early
    if (matches.length === 0) {
      console.log("📧 No matches found, no emails will be sent");
      return NextResponse.json({ message: "No matches found, no emails sent" }, { status: 200 });
    }

    // Get email addresses
    let emailAddresses: string[] = [];

    if (testMode && testEmail) {
      // In test mode, only send to the specified email
      emailAddresses = [testEmail];
      console.log(`📧 Test mode: Only sending to ${testEmail}`);
    } else {
      try {
        console.log("📧 Fetching email addresses from database");
        const emailResult = await pool.query(
          "SELECT email_address FROM email ORDER BY email_address"
        );

        emailAddresses = emailResult.rows.map((row) => row.email_address);
        console.log(`📧 Found ${emailAddresses.length} email addresses in database`);

        if (emailAddresses.length === 0) {
          console.log("📧 No email addresses found in database");
          return NextResponse.json(
            { message: "No email addresses found in database" },
            { status: 404 }
          );
        }
      } catch (dbError) {
        console.error("Database error fetching email addresses:", dbError);
        return NextResponse.json(
          { message: "Failed to fetch email addresses from database" },
          { status: 500 }
        );
      }
    }

    // Convert matches to findings
    console.log("📧 Converting matches to email findings format");
    const findings = matches.map((match) => {
      const keywordStrings = match.keywords.map((k) => k.keyword);

      // Get context from the first keyword match (or combine if multiple)
      let combinedContext = "";
      let combinedHighlightedContext = "";

      if (match.keywords.length > 0) {
        // If there's just one keyword, use its context directly
        if (match.keywords.length === 1) {
          combinedContext = match.keywords[0].context || "";
          combinedHighlightedContext = match.keywords[0].highlightedContext || "";
        } else {
          // For multiple keywords, combine contexts with separators
          combinedContext = match.keywords
            .filter((k) => k.context)
            .map((k) => `"${k.keyword}": ${k.context}`)
            .join("\n\n");

          combinedHighlightedContext = match.keywords
            .filter((k) => k.highlightedContext || k.context)
            .map((k) => {
              const keywordHtml = `<strong>"${k.keyword}"</strong>`;
              const contentHtml = k.highlightedContext || k.context || "";
              return `<div style="margin-bottom: 8px;">${keywordHtml}: ${contentHtml}</div>`;
            })
            .join("");
        }
      }

      const timestamp = match.lastChanged ? new Date(match.lastChanged) : new Date();

      return createFinding(
        match.url,
        keywordStrings,
        timestamp,
        match.title,
        combinedContext,
        combinedHighlightedContext
      );
    });
    console.log(`📧 Created ${findings.length} findings with context for email`);

    // Generate email subject
    const subject = customSubject || `Alert: ${matches.length} Keyword Matches Detected`;
    console.log(`📧 Using email subject: "${subject}"`);

    // Send emails
    console.log(`📧 Preparing to send emails to ${emailAddresses.length} recipients`);
    const emailPromises = emailAddresses.map(async (email) => {
      try {
        console.log(`Sending email alert to ${email} with ${findings.length} findings`);
        await sendAlertEmail({
          subject,
          recipients: [email],
          findings,
          priority: "high",
          email,
        });
        return { email, success: true };
      } catch (error) {
        console.error(`Error sending email to ${email}:`, error);
        return { email, success: false, error: String(error) };
      }
    });

    // Use allSettled to ensure all promises complete regardless of failures
    const emailResults = await Promise.allSettled(
      emailPromises.map((p) =>
        p.catch((e) => {
          console.error("Email promise rejection:", e);
          return { success: false, error: String(e) };
        })
      )
    );

    // Process results from allSettled
    const processedResults = emailResults.map((result, index) => {
      if (result.status === "fulfilled") {
        return result.value;
      } else {
        return {
          email: emailAddresses[index],
          success: false,
          error: result.reason ? String(result.reason) : "Unknown error",
        };
      }
    });

    // Count successes and failures
    const successCount = processedResults.filter((r) => r.success).length;
    const failureCount = processedResults.length - successCount;

    // Return results
    return NextResponse.json(
      {
        message: `Email alerts sent for ${matches.length} URL matches`,
        emailsSent: successCount,
        emailsFailed: failureCount,
        totalEmails: emailAddresses.length,
        testMode,
      },
      { status: 200 }
    );
  } catch (error: unknown) {
    console.error("Error sending email alerts:", error);
    return NextResponse.json(
      { message: "Failed to send email alerts", error: String(error) },
      { status: 500 }
    );
  }
}
