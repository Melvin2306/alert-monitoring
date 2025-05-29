/**
 * API Route: /api/alert/check
 *
 * Checks all monitored URLs for matches with keywords in the database.
 * This endpoint integrates with changedetection.io's API to retrieve changes
 * and then scans them for keywords from the local database.
 */

import {
  fetchLatestSnapshot,
  fetchWatches,
  getApiKeyOrErrorResponse,
} from "@/app/api/lib/changeDetection";
import { extractKeywordContexts, fetchKeywords, findKeywordsInText } from "@/app/api/lib/keywords";
import { WatchMatch } from "@/app/api/lib/types/changeDetection";
import { NextRequest, NextResponse } from "next/server";

/**
 * GET handler to check all monitored URLs for keyword matches
 *
 * This function:
 * 1. Retrieves all keywords from the database
 * 2. Fetches all monitored URLs from changedetection.io
 * 3. For recently changed URLs, fetches their latest snapshot
 * 4. Checks if any keywords are found in the snapshot content
 * 5. Returns matches with relevant context
 *
 * @param {NextRequest} req - The incoming request object
 * @returns {Promise<NextResponse>} JSON response with the results
 */
export async function GET(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const checkRecent = searchParams.get("recent") === "1";
    const hours = parseInt(searchParams.get("hours") || "24");

    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 720) {
      return NextResponse.json(
        { message: "Hours parameter must be between 1 and 720" },
        { status: 400 }
      );
    }

    // Get API key
    const apiKeyOrError = getApiKeyOrErrorResponse(req);
    if (apiKeyOrError instanceof NextResponse) {
      return apiKeyOrError;
    }
    const apiKey = apiKeyOrError;

    // Step 1: Fetch all keywords from database
    const keywordsResult = await fetchKeywords();
    if (keywordsResult instanceof NextResponse) {
      return keywordsResult;
    }

    const keywords = keywordsResult;

    if (keywords.length === 0) {
      return NextResponse.json(
        { message: "No keywords found in database", matches: [] },
        { status: 200 }
      );
    }

    // Step 2: Fetch all monitored URLs from changedetection.io
    const watches = await fetchWatches(apiKey);
    if (watches instanceof NextResponse) {
      return watches;
    }

    // Step 3: Process each watch and check for recently changed ones
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeThreshold = now - hours * 3600; // Time threshold in seconds

    const matches: WatchMatch[] = [];

    // Process each watch in parallel using Promise.all
    await Promise.all(
      Object.entries(watches).map(async ([uuid, watchInfo]) => {
        // Skip watches that haven't changed recently if we're only checking recent changes
        if (checkRecent && (!watchInfo.last_changed || watchInfo.last_changed < timeThreshold)) {
          return;
        }

        // Skip watches with errors
        if (watchInfo.last_error) {
          return;
        }

        // Fetch the latest snapshot for this watch
        const snapshotText = await fetchLatestSnapshot(uuid, apiKey);

        if (!snapshotText) {
          return; // Skip watches with no snapshot
        }

        // Check if any keywords are found in the snapshot
        const matchedKeywords = findKeywordsInText(snapshotText, keywords);

        if (matchedKeywords.length > 0) {
          // Extract a small context around each keyword for better understanding
          const matchContexts = extractKeywordContexts(snapshotText, matchedKeywords);

          matches.push({
            watchId: uuid,
            url: watchInfo.url,
            title: watchInfo.title || watchInfo.url,
            lastChanged: watchInfo.last_changed
              ? new Date(watchInfo.last_changed * 1000).toISOString()
              : null,
            keywords: matchContexts,
          });
        }
      })
    );

    // Return results
    return NextResponse.json(
      {
        message: `Found ${matches.length} URLs with keyword matches`,
        matches,
      },
      { status: 200 }
    );
  } catch {
    return NextResponse.json({ message: "Failed to check for keyword matches" }, { status: 500 });
  }
}
