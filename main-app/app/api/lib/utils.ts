/**
 * Utility functions for API-related operations
 */
import { NextResponse } from "next/server";

/**
 * Gets the API key from request headers and decodes it from base64
 * @param req - The NextRequest object containing headers
 * @throws Will throw an error if API key retrieval fails
 */
export const getApiKey = (req: Request): string => {
  const encodedKey = req.headers.get("x-api-key");
  if (!encodedKey) {
    throw new Error("API key not found in request headers");
  }

  try {
    return atob(encodedKey); // Decode the Base64 encoded API key
  } catch (e) {
    console.error("Error decoding API key:", e);
    throw new Error("Failed to decode API key");
  }
};

/**
 * Safe wrapper to get API key with error handling for API routes
 * Returns the API key if successful, or returns a NextResponse with error info
 *
 * @param req - The NextRequest object containing headers
 * @returns {string | NextResponse} Either the API key or an error response
 */
export const getApiKeyOrErrorResponse = (req: Request): string | NextResponse => {
  try {
    return getApiKey(req);
  } catch (e) {
    console.error("Error retrieving API key:", e);
    return NextResponse.json(
      { message: "API key not configured. Please complete setup first." },
      { status: 401 }
    );
  }
};
