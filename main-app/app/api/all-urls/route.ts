/**
 * API Route: /api/all-urls
 *
 * Handles fetching all URLs being monitored by changedetection.io
 * This endpoint communicates with the changedetection.io API to retrieve all watched URLs
 */

import { getApiKeyOrErrorResponse } from "@/app/api/lib/utils";
import { NextRequest, NextResponse } from "next/server";

/**
 * Interface representing watch information from changedetection.io API
 */
interface WatchInfo {
  url: string;
  title?: string;
  last_checked?: number;
  last_changed?: number;
  last_error?: string | boolean;
}

// Access environment variables for API configuration
const CHANGEDETECTION_BASE_URL = process.env.CHANGEDETECTION_URL || "http://localhost:8080";
const CHANGEDETECTION_WATCH_URL = `${CHANGEDETECTION_BASE_URL}/api/v1/watch`;
const CHANGEDETECTION_SEARCH_URL = `${CHANGEDETECTION_BASE_URL}/api/v1/search`;

/**
 * GET handler to fetch all monitored URLs from changedetection.io
 *
 * This function communicates with the external changedetection.io API
 * to retrieve information about all URLs being monitored.
 *
 * @param {NextRequest} req - The incoming request object containing query parameters
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { message: string, watches: Array<{id, url, title, lastChecked, lastChanged, hasError, errorText}> }
 * @throws Will return error response if the external API request fails
 */
export async function GET(req: NextRequest) {
  try {
    // Parse and validate query parameters
    const { searchParams } = new URL(req.url);
    const tag = searchParams.get("tag");
    const recheckAll = searchParams.get("recheck_all");

    // Validate tag parameter to prevent injection attacks
    if (tag && (typeof tag !== "string" || tag.length > 100)) {
      return NextResponse.json({ message: "Invalid tag parameter" }, { status: 400 });
    }

    // Build API URL with optional query parameters
    let apiUrl = CHANGEDETECTION_WATCH_URL;
    const queryParams = new URLSearchParams();

    if (tag) {
      queryParams.append("tag", tag);
    }

    if (recheckAll === "1") {
      queryParams.append("recheck_all", "1");
    }

    if (queryParams.toString()) {
      apiUrl = `${apiUrl}?${queryParams.toString()}`;
    }

    // Send the request to changedetection.io to get all watches
    // Get the API key
    const apiKeyOrError = getApiKeyOrErrorResponse(req);
    if (apiKeyOrError instanceof NextResponse) {
      return apiKeyOrError; // Return the error response if API key retrieval failed
    }
    const apiKey = apiKeyOrError;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    // Attempt to parse the response JSON
    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error("Error parsing response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from changedetection.io API" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: `Failed to retrieve monitored URLs: ${data.error || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    // Process the data to create a more user-friendly format
    // The changedetection.io API returns data as { uuid: { details }, uuid2: { details }, ... }
    const processedData = Object.entries(data).map(([uuid, watchInfo]) => {
      const info = watchInfo as WatchInfo;
      return {
        id: uuid,
        url: info.url,
        title: info.title || "",
        lastChecked: info.last_checked ? new Date(info.last_checked * 1000).toISOString() : null,
        lastChanged: info.last_changed ? new Date(info.last_changed * 1000).toISOString() : null,
        hasError: !!info.last_error,
        errorText: typeof info.last_error === "string" ? info.last_error : null,
        status: info.last_error
          ? "error"
          : info.last_changed && info.last_changed > 0
            ? "changed"
            : "unchanged",
      };
    });

    // Return success response with the processed data
    return NextResponse.json(
      {
        message: tag
          ? `Successfully retrieved URLs with tag: ${tag}`
          : "Successfully retrieved all monitored URLs",
        watches: processedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error retrieving monitored URLs:", error);
    return NextResponse.json({ message: "Failed to retrieve monitored URLs" }, { status: 500 });
  }
}

/**
 * Search for watches by URL or title text
 *
 * Allows searching of monitored URLs by URL or title text
 * This endpoint accepts search criteria and communicates with the changedetection.io API
 *
 * @param {NextRequest} req - The incoming request object containing search parameters
 * @returns {Promise<NextResponse>} JSON response with format:
 *   { message: string, watches: Array<{id, url, title, lastChecked, lastChanged, hasError, errorText, status}> }
 * @throws Will return error response if the external API request fails or search parameters are invalid
 */
export async function POST(req: NextRequest) {
  try {
    // Check content type for security
    const contentType = req.headers.get("content-type");
    if (!contentType || !contentType.includes("application/json")) {
      return NextResponse.json(
        { message: "Content-Type must be application/json" },
        { status: 415 }
      );
    }

    // Limit request size to prevent DOS attacks
    const contentLength = req.headers.get("content-length");
    if (contentLength && parseInt(contentLength) > 5000) {
      return NextResponse.json({ message: "Request body too large" }, { status: 413 });
    }

    // Parse the incoming request body with error handling
    let body;
    try {
      body = await req.json();
    } catch (error) {
      console.error("Error parsing request body:", error);
      return NextResponse.json({ message: "Invalid JSON in request body" }, { status: 400 });
    }

    const { query, tag, partial } = body;

    // Validate required parameters
    if (!query) {
      return NextResponse.json({ message: "Search query is required" }, { status: 400 });
    }

    // Validate parameter types and lengths
    if (typeof query !== "string" || query.length > 500) {
      return NextResponse.json({ message: "Invalid query format or length" }, { status: 400 });
    }

    if (tag && (typeof tag !== "string" || tag.length > 100)) {
      return NextResponse.json({ message: "Invalid tag format or length" }, { status: 400 });
    }

    // Build API URL with query parameters
    const queryParams = new URLSearchParams();
    queryParams.append("q", query);

    if (tag) {
      queryParams.append("tag", tag);
    }

    if (partial) {
      queryParams.append("partial", "true");
    }

    const apiUrl = `${CHANGEDETECTION_SEARCH_URL}?${queryParams.toString()}`;

    // Send the request to changedetection.io to search for watches
    const apiKeyOrError = getApiKeyOrErrorResponse(req);
    if (apiKeyOrError instanceof NextResponse) {
      return apiKeyOrError; // Return the error response if API key retrieval failed
    }
    const apiKey = apiKeyOrError;

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "x-api-key": apiKey,
      },
    });

    // Attempt to parse the response JSON
    let data;
    try {
      const responseText = await response.text();
      data = responseText ? JSON.parse(responseText) : {};
    } catch (e) {
      console.error("Error parsing response as JSON:", e);
      return NextResponse.json(
        { message: "Invalid response from changedetection.io API" },
        { status: 500 }
      );
    }

    if (!response.ok) {
      return NextResponse.json(
        {
          message: `Failed to search monitored URLs: ${data.error || "Unknown error"}`,
        },
        { status: response.status }
      );
    }

    // Process the data same as in the GET function
    const processedData = Object.entries(data).map(([uuid, watchInfo]) => {
      const info = watchInfo as WatchInfo;
      return {
        id: uuid,
        url: info.url,
        title: info.title || "",
        lastChecked: info.last_checked ? new Date(info.last_checked * 1000).toISOString() : null,
        lastChanged: info.last_changed ? new Date(info.last_changed * 1000).toISOString() : null,
        hasError: !!info.last_error,
        errorText: typeof info.last_error === "string" ? info.last_error : null,
        status: info.last_error
          ? "error"
          : info.last_changed && info.last_changed > 0
            ? "changed"
            : "unchanged",
      };
    });

    // Return success response with the search results
    return NextResponse.json(
      {
        message: `Successfully found ${processedData.length} matching watches`,
        watches: processedData,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Error searching monitored URLs:", error);
    return NextResponse.json({ message: "Failed to search monitored URLs" }, { status: 500 });
  }
}
