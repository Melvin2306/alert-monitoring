import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";

// Simple in-memory store for rate limiting
// In production, use Redis or another external store for distributed systems
const ipRequestCounts = new Map<string, { count: number; timestamp: number }>();

// Rate limiting configuration
const RATE_LIMIT_MAX = 60; // Maximum requests per window
const RATE_LIMIT_WINDOW_MS = 60 * 1000; // Window size in milliseconds (1 minute)

/**
 * Middleware function that runs before each request to API routes
 * Implements CORS, rate limiting, and basic security headers
 */
export function middleware(request: NextRequest) {
  // Get the client's IP address (when deployed, use request.ip)
  const ip = request.headers.get("x-forwarded-for") || "unknown";

  // Skip rate limiting for non-API routes
  if (!request.nextUrl.pathname.startsWith("/api")) {
    return NextResponse.next();
  }

  // Implement rate limiting for API routes
  const now = Date.now();
  const ipData = ipRequestCounts.get(ip);

  // Calculate rate limiting
  if (!ipData) {
    // First request from this IP
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
  } else if (now - ipData.timestamp > RATE_LIMIT_WINDOW_MS) {
    // Window has passed, reset counter
    ipRequestCounts.set(ip, { count: 1, timestamp: now });
  } else {
    // Increment counter
    ipData.count++;
    if (ipData.count > RATE_LIMIT_MAX) {
      // Rate limit exceeded
      return new NextResponse(
        JSON.stringify({
          message: "Too many requests, please try again later",
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "X-Rate-Limit-Limit": RATE_LIMIT_MAX.toString(),
            "X-Rate-Limit-Reset": new Date(ipData.timestamp + RATE_LIMIT_WINDOW_MS).toISOString(),
          },
        }
      );
    }
  }

  // Set CORS and security headers
  const response = NextResponse.next();

  // Allow requests only from your own domain in production
  // For development, you might want to allow more origins
  response.headers.set(
    "Access-Control-Allow-Origin",
    process.env.NODE_ENV === "production" ? process.env.APP_URL || "https://yourapp.com" : "*"
  );

  response.headers.set("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  response.headers.set("Access-Control-Allow-Headers", "Content-Type, Authorization");

  // Security headers
  response.headers.set("X-Content-Type-Options", "nosniff");
  response.headers.set("X-Frame-Options", "DENY");
  response.headers.set("X-XSS-Protection", "1; mode=block");
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // Not setting CSP yet as it requires careful configuration based on your front-end needs

  return response;
}

/**
 * Configure which paths this middleware runs on
 * This will apply the middleware to all routes
 */
export const config = {
  matcher: [
    // Apply to all API routes
    "/api/:path*",
  ],
};
