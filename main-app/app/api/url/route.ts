/**
 * API Route: /api/url
 *
 * Handles URL submissions, updates, and deletions for monitoring.
 * These endpoints forward URL data to the changedetection.io API.
 * Implements full CRUD operations for URL watches with appropriate validation.
 */

import { addApiKeyToHeaders, withApiKeyAuth } from "@/app/api/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// Set API configuration
// Note: Using environment variables as fallbacks when localStorage isn't available (during SSR)
const CHANGEDETECTION_BASE_URL = process.env.CHANGEDETECTION_URL || "http://localhost:8080";
const CHANGEDETECTION_URL = `${CHANGEDETECTION_BASE_URL}/api/v1/watch`;

// Define maximum limits for security
const MAX_TITLE_LENGTH = 200;
const MAX_URL_LENGTH = 2048; // Reasonable URL length limit

// Allowed URL schemes for security
const ALLOWED_SCHEMES = ["http:", "https:"];

// Blocked network patterns to prevent SSRF
const BLOCKED_HOSTS = [
  /^localhost$/i,
  /^127\.\d+\.\d+\.\d+$/,
  /^10\.\d+\.\d+\.\d+$/,
  /^172\.(1[6-9]|2\d|3[0-1])\.\d+\.\d+$/,
  /^192\.168\.\d+\.\d+$/,
  /^0\.0\.0\.0$/,
  /^::1$/,
  /^fd[0-9a-f]{2}:/i,
  /^fe80:/i,
];

// Check if the changedetection.io URL is valid
if (!CHANGEDETECTION_BASE_URL) {
  // Environment variable not set
}

/**
 * Sanitizes user input to prevent XSS and other injection attacks
 * @param {string} input - The string to sanitize
 * @returns {string} Sanitized string with potentially harmful characters escaped
 */
function sanitizeInput(input: string): string {
  return input
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

/**
 * POST handler for adding a new URL to monitor
 */
export const POST = withApiKeyAuth(async (req: NextRequest, apiKey: string) => {
  try {
    // Parse the incoming request body
    const body = await req.json();
    const { url, title } = body;

    // Validate required fields
    if (!url) {
      return NextResponse.json({ message: "URL is required" }, { status: 400 });
    }

    // Validate URL format and length
    let parsedUrl: URL;
    try {
      parsedUrl = new URL(url);

      // Check for allowed URL schemes
      if (!ALLOWED_SCHEMES.includes(parsedUrl.protocol)) {
        return NextResponse.json(
          {
            message: `URL scheme '${parsedUrl.protocol}' is not allowed. Only HTTP and HTTPS are permitted.`,
          },
          { status: 400 }
        );
      }

      // Check for blocked hosts (SSRF prevention)
      const hostname = parsedUrl.hostname.toLowerCase();
      for (const pattern of BLOCKED_HOSTS) {
        if (pattern.test(hostname)) {
          return NextResponse.json(
            { message: "URLs pointing to internal or private networks are not allowed" },
            { status: 403 }
          );
        }
      }

      // Check URL length
      if (url.length > MAX_URL_LENGTH) {
        return NextResponse.json(
          {
            message: `URL exceeds maximum allowed length of ${MAX_URL_LENGTH} characters`,
          },
          { status: 400 }
        );
      }
    } catch {
      return NextResponse.json({ message: "Invalid URL format" }, { status: 400 });
    }

    // Validate title if provided
    if (title && (typeof title !== "string" || title.length > MAX_TITLE_LENGTH)) {
      return NextResponse.json(
        {
          message: `Invalid title format or exceeds maximum length of ${MAX_TITLE_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    // Prepare the data payload for changedetection.io
    const watchData: { url: string; title?: string } = {
      url,
    };

    if (title) {
      // Sanitize title to prevent XSS
      watchData.title = sanitizeInput(title);
    }

    // Send the request to changedetection.io with API key
    const response = await fetch(CHANGEDETECTION_URL, {
      method: "POST",
      headers: addApiKeyToHeaders(apiKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(watchData),
    });

    // Read the response body text once and store it
    const responseText = await response.text();

    // Handle the response from changedetection.io
    let data;
    try {
      // Parse the response text if it's valid JSON
      data = responseText ? JSON.parse(responseText) : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: `Failed to add URL to monitoring: ${data.error || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: "URL successfully added to monitoring",
        watchId: data.uuid || data.id, // Depending on what changedetection.io returns
      },
      { status: 201 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to process URL submission" }, { status: 500 });
  }
});

/**
 * PUT handler for updating an existing monitored URL
 */
export const PUT = withApiKeyAuth(async (req: NextRequest, apiKey: string) => {
  try {
    // Parse the incoming request body
    const body = await req.json();
    const { watchId, url, title } = body;

    if (!watchId) {
      return NextResponse.json({ message: "Watch ID is required" }, { status: 400 });
    }

    // Validate URL format and length if provided
    if (url) {
      let parsedUrl: URL;
      try {
        parsedUrl = new URL(url);

        // Check for allowed URL schemes
        if (!ALLOWED_SCHEMES.includes(parsedUrl.protocol)) {
          return NextResponse.json(
            {
              message: `URL scheme '${parsedUrl.protocol}' is not allowed. Only HTTP and HTTPS are permitted.`,
            },
            { status: 400 }
          );
        }

        // Check for blocked hosts (SSRF prevention)
        const hostname = parsedUrl.hostname.toLowerCase();
        for (const pattern of BLOCKED_HOSTS) {
          if (pattern.test(hostname)) {
            return NextResponse.json(
              { message: "URLs pointing to internal or private networks are not allowed" },
              { status: 403 }
            );
          }
        }

        // Check URL length
        if (url.length > MAX_URL_LENGTH) {
          return NextResponse.json(
            {
              message: `URL exceeds maximum allowed length of ${MAX_URL_LENGTH} characters`,
            },
            { status: 400 }
          );
        }
      } catch {
        return NextResponse.json({ message: "Invalid URL format" }, { status: 400 });
      }
    }

    // Validate title if provided (prevent XSS)
    if (title && (typeof title !== "string" || title.length > MAX_TITLE_LENGTH)) {
      return NextResponse.json(
        {
          message: `Invalid title format or exceeds maximum length of ${MAX_TITLE_LENGTH} characters`,
        },
        { status: 400 }
      );
    }

    // Prepare the data payload for changedetection.io
    const watchData: { url?: string; title?: string } = {};

    if (url) watchData.url = url;
    if (title) watchData.title = sanitizeInput(title);

    if (Object.keys(watchData).length === 0) {
      return NextResponse.json({ message: "No update data provided" }, { status: 400 });
    }

    // Send the request to changedetection.io
    const response = await fetch(`${CHANGEDETECTION_URL}/${watchId}`, {
      method: "PUT",
      headers: addApiKeyToHeaders(apiKey, {
        "Content-Type": "application/json",
      }),
      body: JSON.stringify(watchData),
    });

    // Handle the response from changedetection.io
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        {
          message: `Failed to update URL: ${errorData.error || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: "URL monitoring settings updated successfully",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to process URL update" }, { status: 500 });
  }
});

/**
 * DELETE handler for removing a URL from monitoring
 */
export const DELETE = withApiKeyAuth(async (req: NextRequest, apiKey: string) => {
  try {
    // Get the watch ID from the URL or request body
    const { searchParams } = new URL(req.url);
    let watchId = searchParams.get("watchId");

    // If not in URL, try to get from request body
    if (!watchId) {
      const body = await req.json().catch(() => ({}));
      watchId = body.watchId;
    }

    if (!watchId) {
      return NextResponse.json({ message: "Watch ID is required" }, { status: 400 });
    }

    // Send the delete request to changedetection.io
    const response = await fetch(`${CHANGEDETECTION_URL}/${watchId}`, {
      method: "DELETE",
      headers: addApiKeyToHeaders(apiKey),
    });

    // Handle the response from changedetection.io
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ error: "Unknown error" }));
      return NextResponse.json(
        {
          message: `Failed to delete URL monitoring: ${errorData.error || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        message: "URL monitoring removed successfully",
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to process delete request" }, { status: 500 });
  }
});

/**
 * PATCH handler for refreshing a specific URL
 */
export const PATCH = withApiKeyAuth(async (req: NextRequest, apiKey: string) => {
  try {
    // Parse the incoming request body
    const body = await req.json();
    const { watchId } = body;

    if (!watchId) {
      return NextResponse.json({ message: "Watch ID is required" }, { status: 400 });
    }

    // According to the API docs, to recheck a specific watch, use /v1/watch/:uuid?recheck=1
    const response = await fetch(`${CHANGEDETECTION_URL}/${watchId}?recheck=1`, {
      method: "GET",
      headers: addApiKeyToHeaders(apiKey),
    });

    // Handle the response from changedetection.io
    if (!response.ok) {
      const errorStatus = response.status;
      const errorText = await response.text();
      let errorMessage = "Unknown error";

      try {
        const errorData = JSON.parse(errorText);
        errorMessage = errorData.error || errorData.message || "Unknown error";
      } catch {
        // If parsing fails, use the raw error text
        errorMessage = errorText || "Unknown error";
      }

      return NextResponse.json(
        {
          success: false,
          message: `Failed to refresh URL: ${errorMessage}`,
          status: errorStatus,
          details: errorText,
        },
        { status: response.status }
      );
    }

    // Return success response
    return NextResponse.json(
      {
        success: true,
        message: "URL refresh triggered successfully",
        data: await response.json().catch(() => ({})),
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to trigger URL refresh" }, { status: 500 });
  }
});
