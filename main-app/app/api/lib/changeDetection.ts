/**
 * Functions for interacting with the changedetection.io API
 */
import { NextRequest, NextResponse } from "next/server";
import { WatchInfo } from "./types/changeDetection";

// Access environment variables for API configuration
const CHANGEDETECTION_BASE_URL = process.env.CHANGEDETECTION_URL || "http://localhost:8080";
const CHANGEDETECTION_WATCH_URL = `${CHANGEDETECTION_BASE_URL}/api/v1/watch`;

/**
 * Helper function to retrieve API key from request or environment
 * @param {NextRequest} req - The incoming request object
 * @returns {string | NextResponse} - API key or error response
 */
export function getApiKeyOrErrorResponse(req: NextRequest): string | NextResponse {
  // Try to get API key from request header
  const apiKey = req.headers.get("x-api-key");
  
  // If no API key in header, try environment variable
  if (!apiKey) {
    const envApiKey = process.env.CHANGEDETECTION_API_KEY;
    if (!envApiKey) {
      return NextResponse.json(
        { message: "API key is required" },
        { status: 401 }
      );
    }
    return envApiKey;
  }
  
  return apiKey;
}

/**
 * Fetch all monitored URLs from changedetection.io
 * @param {string} apiKey - The API key for changedetection.io
 * @returns {Promise<Record<string, WatchInfo> | NextResponse>} - Watches or error response
 */
export async function fetchWatches(apiKey: string): Promise<Record<string, WatchInfo> | NextResponse> {
  try {
    const watchesResponse = await fetch(CHANGEDETECTION_WATCH_URL, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });
    
    if (!watchesResponse.ok) {
      const errorText = await watchesResponse.text();
      throw new Error(`Failed to fetch watches: Status ${watchesResponse.status} - ${errorText}`);
    }
    
    const watchesText = await watchesResponse.text();
    return JSON.parse(watchesText);
  } catch (error: unknown) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error("Error fetching watches from changedetection.io:", errorMessage);
    
    return NextResponse.json(
      { 
        message: "Failed to fetch monitored URLs", 
        details: errorMessage,
        url: CHANGEDETECTION_WATCH_URL
      },
      { status: 500 }
    );
  }
}

/**
 * Fetch the latest snapshot for a watch
 * @param {string} uuid - The UUID of the watch
 * @param {string} apiKey - The API key for changedetection.io
 * @returns {Promise<string | null>} - Snapshot text or null if error
 */
export async function fetchLatestSnapshot(uuid: string, apiKey: string): Promise<string | null> {
  try {
    const historyResponse = await fetch(`${CHANGEDETECTION_WATCH_URL}/${uuid}/history/latest?html=1`, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });
    
    if (!historyResponse.ok) {
      return null;
    }
    
    return await historyResponse.text();
  } catch (error) {
    console.error(`Error fetching snapshot for watch ${uuid}:`, error);
    return null;
  }
}
