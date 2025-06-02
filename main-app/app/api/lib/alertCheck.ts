/**
 * Shared alert checking logic that can be used by both the route handler and other services
 */

import { fetchLatestSnapshot, fetchWatches } from "@/app/api/lib/changeDetection";
import { extractKeywordContexts, fetchKeywords, findKeywordsInText } from "@/app/api/lib/keywords";
import { WatchMatch } from "@/app/api/lib/types";

/**
 * Core alert checking logic that can be called from anywhere
 *
 * @param apiKey - The API key for changedetection.io
 * @param checkRecent - Whether to only check recently changed URLs
 * @param hours - Number of hours to look back for recent changes
 * @returns Promise with matches array and message
 */
export async function checkForKeywordMatches(
  apiKey: string,
  checkRecent: boolean = true,
  hours: number = 24
): Promise<{ matches: WatchMatch[]; message: string }> {
  // Step 1: Fetch all keywords from database
  const keywordsResult = await fetchKeywords();
  if (keywordsResult instanceof Response) {
    throw new Error("Failed to fetch keywords from database");
  }

  const keywords = keywordsResult;

  if (keywords.length === 0) {
    return {
      message: "No keywords found in database",
      matches: [],
    };
  }

  // Step 2: Fetch all monitored URLs from changedetection.io
  const watches = await fetchWatches(apiKey);
  if (watches instanceof Response) {
    throw new Error("Failed to fetch watches from changedetection.io");
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

  return {
    message: `Found ${matches.length} URLs with keyword matches`,
    matches,
  };
}
