/**
 * API Route: /api/cron
 *
 * Cron job endpoint that checks monitored URLs for specific keywords
 * This will be executed on a schedule to detect important changes and send notifications
 */

import { withApiKeyAuth } from "@/app/api/lib/utils";
import { NextRequest, NextResponse } from "next/server";

// Access environment variables for API configuration
const CHANGEDETECTION_URL = process.env.CHANGEDETECTION_URL || "http://localhost:5000/api/v1/watch";

// Keywords to filter for in the detected changes
const KEYWORDS = [
  "security breach",
  "acquisition",
  "merger",
  "lawsuit",
  "new product",
  "launch",
  "CEO",
  "bankruptcy",
  "funding",
  "layoff",
];

/**
 * Interface representing watch information from changedetection.io API
 */
interface WatchInfo {
  url: string;
  title?: string;
  last_changed?: number; // Unix timestamp of last detected change
  last_checked?: number; // Unix timestamp of last check
  last_error?: boolean | string; // Error information if the last check failed
  uuid?: string; // Unique identifier for the watch
}

/**
 * Interface representing a change that matched our keyword criteria
 */
interface MatchedChange {
  url: string; // URL of the monitored page
  title: string; // Title of the monitored page
  matchedKeywords: string[]; // List of keywords that were matched
  matchedText: string[]; // Snippets of text containing matched keywords
  lastChanged: string; // ISO timestamp of when the change was detected
}

/**
 * GET endpoint handler for the cron job
 *
 * Checks all monitored URLs for changes containing specific keywords.
 * This endpoint should be called by a scheduled task or external cron service.
 * It fetches all monitored URLs, checks for recent changes, and looks for
 * keyword matches in the content.
 *
 * @param {NextRequest} req - The incoming request object
 * @param {string} apiKey - The decoded API key from the request header
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { message: string, matchedChanges?: Array<MatchedChange> } detailing any matches found
 * @throws Will return error response if the external API requests fail
 */
export const GET = withApiKeyAuth(async (req: NextRequest, apiKey: string) => {
  try {
    // Step 1: Fetch all watches
    const allWatches = await fetchAllWatches(apiKey);

    if (!allWatches || Object.keys(allWatches).length === 0) {
      return NextResponse.json(
        {
          message: "No watches found to check for changes",
        },
        { status: 200 }
      );
    }

    // Step 2: Check for recent changes (in the last 24 hours)
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const oneDayAgo = now - 24 * 60 * 60; // 24 hours ago in seconds

    const recentlyChangedWatches = filterRecentlyChangedWatches(allWatches, oneDayAgo);

    if (recentlyChangedWatches.length === 0) {
      return NextResponse.json(
        {
          message: "No recent changes detected in the last 24 hours",
        },
        { status: 200 }
      );
    }

    // Step 3: Fetch the content of recently changed watches and check for keywords
    const matchedChanges: MatchedChange[] = await checkWatchesForKeywords(
      recentlyChangedWatches,
      apiKey
    );

    // Step 4: Return the results
    if (matchedChanges.length === 0) {
      return NextResponse.json(
        {
          message: "No notifications: None of the recent changes matched our keywords",
        },
        { status: 200 }
      );
    }

    return NextResponse.json(
      {
        message: `Found ${matchedChanges.length} matching changes`,
        matches: matchedChanges,
      },
      { status: 200 }
    );
  } catch (error) {
    return NextResponse.json(
      {
        message: "Failed to process cron job",
        error: error instanceof Error ? error.message : String(error),
      },
      { status: 500 }
    );
  }
});

/**
 * Fetches all watches from changedetection.io API
 *
 * Makes a GET request to the external API to retrieve all monitored URLs
 * and their metadata. Includes error handling for network or API issues.
 *
 * @param {string} apiKey - The API key for changedetection.io
 * @returns {Promise<Record<string, WatchInfo>>} Object containing all watches with their UUIDs as keys
 * @throws {Error} If the API request fails or returns invalid data
 */
async function fetchAllWatches(apiKey: string): Promise<Record<string, WatchInfo>> {
  try {
    // Add timeout to prevent hanging if API is unresponsive
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 30000); // 30 second timeout

    const response = await fetch(CHANGEDETECTION_URL, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
      signal: controller.signal,
    });

    // Clear the timeout since request completed
    clearTimeout(timeoutId);

    if (!response.ok) {
      throw new Error(`Failed to fetch watches: ${response.status} ${response.statusText}`);
    }

    // Parse the response with error handling
    let data;
    try {
      data = await response.json();
    } catch {
      throw new Error("Invalid response format from changedetection.io API");
    }

    return data;
  } catch (error) {
    // Handle abort errors specifically
    if (error instanceof Error && error.name === "AbortError") {
      throw new Error("Request to changedetection.io API timed out");
    }
    throw error;
  }
}

/**
 * Filters watches that have changed recently (after the cutoff time)
 * @param {Record<string, WatchInfo>} watches - All watches to filter
 * @param {number} cutoffTime - Unix timestamp to use as cutoff point
 * @returns {Array<WatchInfo & { uuid: string }>} Array of recently changed watches with uuid included
 */
function filterRecentlyChangedWatches(
  watches: Record<string, WatchInfo>,
  cutoffTime: number
): Array<WatchInfo & { uuid: string }> {
  const recentlyChanged: Array<WatchInfo & { uuid: string }> = [];

  for (const [uuid, watch] of Object.entries(watches)) {
    // If the watch has changed recently and doesn't have an error
    if (watch.last_changed && watch.last_changed > cutoffTime && !watch.last_error) {
      // Add the UUID to the watch object for easier reference
      recentlyChanged.push({ ...watch, uuid });
    }
  }

  return recentlyChanged;
}

/**
 * Fetches the content of a specific watch from changedetection.io
 * @param {string} uuid - The unique identifier for the watch
 * @param {string} apiKey - The API key for changedetection.io
 * @param {number} [timestamp] - Optional timestamp to fetch a specific snapshot
 * @returns {Promise<string>} The content of the watch
 * @throws {Error} If the API request fails
 */
async function fetchWatchContent(
  uuid: string,
  apiKey: string,
  timestamp?: number
): Promise<string> {
  let url = `${CHANGEDETECTION_URL}/${uuid}/history`;

  // If a specific timestamp is provided, fetch that snapshot
  // Otherwise, fetch the latest snapshot
  if (timestamp) {
    url = `${url}/${timestamp}`;
  } else {
    url = `${url}/latest`;
  }

  const response = await fetch(url, {
    method: "GET",
    headers: {
      "x-api-key": apiKey,
    },
  });

  if (!response.ok) {
    throw new Error(`Failed to fetch watch content: ${response.status} ${response.statusText}`);
  }

  return await response.text();
}

/**
 * Checks the content of watches for specific keywords
 * @param {Array<WatchInfo & { uuid: string }>} watches - Array of watches to check
 * @param {string} apiKey - The API key for changedetection.io
 * @returns {Promise<MatchedChange[]>} Array of matches with contextual information
 */
async function checkWatchesForKeywords(
  watches: Array<WatchInfo & { uuid: string }>,
  apiKey: string
): Promise<MatchedChange[]> {
  const matchedChanges: MatchedChange[] = [];

  for (const watch of watches) {
    try {
      // Fetch the latest content for this watch
      const content = await fetchWatchContent(watch.uuid!, apiKey);

      // Check if any keywords match in the content
      const matchedKeywords = KEYWORDS.filter((keyword) =>
        content.toLowerCase().includes(keyword.toLowerCase())
      );

      if (matchedKeywords.length > 0) {
        // Extract some context around each matched keyword
        const matchedText = extractMatchContext(content, matchedKeywords);

        matchedChanges.push({
          url: watch.url,
          title: watch.title || "Untitled Watch",
          matchedKeywords,
          matchedText,
          lastChanged: new Date(watch.last_changed! * 1000).toISOString(),
        });
      }
    } catch {
      // Continue with other watches even if one fails
    }
  }

  return matchedChanges;
}

/**
 * Extracts contextual text snippets around matched keywords
 * @param {string} content - The full content text to search within
 * @param {string[]} keywords - List of keywords to find in the content
 * @returns {string[]} Array of text snippets with context around each keyword match
 */
function extractMatchContext(content: string, keywords: string[]): string[] {
  const matchContexts: string[] = [];
  const contentLower = content.toLowerCase();

  keywords.forEach((keyword) => {
    const keywordLower = keyword.toLowerCase();
    let startIndex = 0;

    while (startIndex < content.length) {
      const matchIndex = contentLower.indexOf(keywordLower, startIndex);
      if (matchIndex === -1) break;

      // Get context around the match (50 chars before and after)
      const contextStart = Math.max(0, matchIndex - 50);
      const contextEnd = Math.min(content.length, matchIndex + keyword.length + 50);
      const matchContext = content.substring(contextStart, contextEnd);

      // Add ellipsis if we've truncated the text
      const formattedContext =
        (contextStart > 0 ? "..." : "") +
        matchContext.trim() +
        (contextEnd < content.length ? "..." : "");

      matchContexts.push(formattedContext);

      // Move past this match to find the next one
      startIndex = matchIndex + keyword.length;
    }
  });

  return matchContexts;
}
