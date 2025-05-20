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
  getApiKeyOrErrorResponse
} from "@/app/api/lib/changeDetection";
import {
  extractKeywordContexts,
  fetchKeywords,
  findKeywordsInText
} from "@/app/api/lib/keywords";
import {
  WatchMatch
} from "@/app/api/lib/types/changeDetection";
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
    console.log("DEBUG: Starting keyword check request");
    
    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const checkRecent = searchParams.get("recent") === "1";
    const hours = parseInt(searchParams.get("hours") || "24");
    
    console.log(`DEBUG: Parameters - checkRecent: ${checkRecent}, hours: ${hours}`);
    
    // Validate hours parameter
    if (isNaN(hours) || hours < 1 || hours > 720) {
      console.log(`DEBUG: Invalid hours parameter: ${hours}`);
      return NextResponse.json(
        { message: "Hours parameter must be between 1 and 720" },
        { status: 400 }
      );
    }
    
    // Get API key
    const apiKeyOrError = getApiKeyOrErrorResponse(req);
    if (apiKeyOrError instanceof NextResponse) {
      console.log("DEBUG: API key error - returning error response");
      return apiKeyOrError;
    }
    const apiKey = apiKeyOrError;
    console.log("DEBUG: API key obtained successfully");
    
    // Step 1: Fetch all keywords from database
    console.log("DEBUG: Fetching keywords from database");
    const keywordsResult = await fetchKeywords();
    if (keywordsResult instanceof NextResponse) {
      console.log("DEBUG: Error fetching keywords");
      return keywordsResult;
    }
    
    const keywords = keywordsResult;
    console.log(`DEBUG: Found ${keywords.length} keywords in database`);
    
    if (keywords.length === 0) {
      console.log("DEBUG: No keywords found, returning empty matches");
      return NextResponse.json(
        { message: "No keywords found in database", matches: [] },
        { status: 200 }
      );
    }
    
    // Step 2: Fetch all monitored URLs from changedetection.io
    console.log("DEBUG: Fetching watches from changedetection.io");
    const watches = await fetchWatches(apiKey);
    if (watches instanceof NextResponse) {
      console.log("DEBUG: Error fetching watches");
      return watches;
    }
    
    console.log(`DEBUG: Found ${Object.keys(watches).length} watches`);
    
    // Step 3: Process each watch and check for recently changed ones
    const now = Math.floor(Date.now() / 1000); // Current time in seconds
    const timeThreshold = now - (hours * 3600); // Time threshold in seconds
    console.log(`DEBUG: Time threshold for recent changes: ${new Date(timeThreshold * 1000).toISOString()}`);
    
    const matches: WatchMatch[] = [];
    
    // Process each watch in parallel using Promise.all
    console.log("DEBUG: Processing watches in parallel");
    await Promise.all(Object.entries(watches).map(async ([uuid, watchInfo]) => {
      console.log(`DEBUG: Processing watch ${uuid} - ${watchInfo.title || watchInfo.url}`);
      
      // Skip watches that haven't changed recently if we're only checking recent changes
      if (checkRecent && (!watchInfo.last_changed || watchInfo.last_changed < timeThreshold)) {
        console.log(`DEBUG: Skipping watch ${uuid} - not changed recently`);
        return;
      }
      
      // Skip watches with errors
      if (watchInfo.last_error) {
        console.log(`DEBUG: Skipping watch ${uuid} - has error: ${watchInfo.last_error}`);
        return;
      }
      
      // Fetch the latest snapshot for this watch
      console.log(`DEBUG: Fetching snapshot for watch ${uuid}`);
      const snapshotText = await fetchLatestSnapshot(uuid, apiKey);
      
      if (!snapshotText) {
        console.log(`DEBUG: Skipping watch ${uuid} - no snapshot available`);
        return; // Skip watches with no snapshot
      }
      
      console.log(`DEBUG: Checking keywords in snapshot for watch ${uuid} (${snapshotText.length} chars)`);
      // Check if any keywords are found in the snapshot
      const matchedKeywords = findKeywordsInText(snapshotText, keywords);
      
      if (matchedKeywords.length > 0) {
        console.log(`DEBUG: Found ${matchedKeywords.length} keyword matches in watch ${uuid}: ${matchedKeywords.join(', ')}`);
        // Extract a small context around each keyword for better understanding
        const matchContexts = extractKeywordContexts(snapshotText, matchedKeywords);
        
        matches.push({
          watchId: uuid,
          url: watchInfo.url,
          title: watchInfo.title || watchInfo.url,
          lastChanged: watchInfo.last_changed ? new Date(watchInfo.last_changed * 1000).toISOString() : null,
          keywords: matchContexts
        });
      }
    }));
    
    // Return results
    console.log(`DEBUG: Completed processing. Found ${matches.length} matches`);
    if (matches.length > 0) {
      console.log(`DEBUG: Match URLs: ${matches.map(m => m.url).join(', ')}`);
    }
    
    return NextResponse.json({
      message: `Found ${matches.length} URLs with keyword matches`,
      matches
    }, { status: 200 });
    
  } catch (error: unknown) {
    console.error("Error checking for keyword matches:", error);
    console.log(`DEBUG: Exception caught: ${error instanceof Error ? error.message : String(error)}`);
    return NextResponse.json(
      { message: "Failed to check for keyword matches" },
      { status: 500 }
    );
  }
}
