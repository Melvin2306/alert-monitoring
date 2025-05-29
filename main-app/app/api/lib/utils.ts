import { NextRequest, NextResponse } from "next/server";

/**
 * Decodes a base64 encoded API key from the frontend
 *
 * @param encodedApiKey The base64 encoded API key from the frontend
 * @returns The decoded API key or null if invalid
 */
function decodeApiKey(encodedApiKey: string): string | null {
  try {
    return Buffer.from(encodedApiKey, "base64").toString("utf-8");
  } catch {
    return null;
  }
}

/**
 * Validates and extracts the API key from the request
 *
 * @param request The incoming request
 * @returns Object with decoded API key or error response
 */
export function validateAndExtractApiKey(
  request: NextRequest
): { apiKey: string } | { error: NextResponse } {
  // Get base64 encoded API key from request headers
  const encodedApiKey = request.headers.get("x-api-key");

  if (!encodedApiKey) {
    return {
      error: NextResponse.json(
        {
          error: "API key not found in request headers",
          message: "Please provide a valid API key in the X-Api-Key header",
        },
        { status: 401 }
      ),
    };
  }

  // Decode the base64 API key
  const decodedApiKey = decodeApiKey(encodedApiKey);

  if (!decodedApiKey) {
    return {
      error: NextResponse.json(
        {
          error: "Invalid API key format",
          message: "The provided API key could not be decoded",
        },
        { status: 401 }
      ),
    };
  }

  return { apiKey: decodedApiKey };
}

/**
 * Higher-order function to create a middleware that validates API key
 *
 * @param handler The request handler to wrap with API key validation
 * @returns A new handler that includes API key validation
 */
export function withApiKeyAuth<T>(
  handler: (request: NextRequest, apiKey: string) => Promise<T>
): (request: NextRequest) => Promise<T | NextResponse> {
  return async function (request: NextRequest) {
    // Validate and extract API key
    const result = validateAndExtractApiKey(request);

    // Return error response if validation failed
    if ("error" in result) {
      return result.error;
    }

    // Continue with handler if validation succeeded
    return await handler(request, result.apiKey);
  };
}

/**
 * Helper function to add API key to headers for outgoing requests to changedetection.io
 *
 * @param apiKey The decoded API key to use for changedetection.io
 * @param headers Optional existing headers to extend
 * @returns Headers with API key added
 */
export function addApiKeyToHeaders(apiKey: string, headers: HeadersInit = {}): HeadersInit {
  const headerEntries =
    headers instanceof Headers ? Array.from(headers.entries()) : Object.entries(headers);

  return {
    ...Object.fromEntries(headerEntries),
    "x-api-key": apiKey,
  };
}
