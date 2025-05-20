// Default export for tailwind-merge
import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Utility functions for client-side operations
 */

/**
 * Formats a date string to a more readable format
 * @param dateString - ISO format date string
 * @returns Formatted date and time string
 */
export const formatDate = (dateString: string | null | undefined) => {
  if (!dateString) return "-";
  const date = new Date(dateString);
  return (
    date.toLocaleDateString() +
    " " +
    date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
  );
};

/**
 * Determines the color for status indicators
 * @param status - The current status of the monitored item
 * @returns CSS class for text color
 */
export const getStatusColor = (status?: string) => {
  switch (status) {
    case "unchanged":
      return "text-green-500";
    case "changed":
      return "text-amber-500";
    case "error":
      return "text-red-500";
    case "pending":
      return "text-blue-500";
    default:
      return "text-gray-500";
  }
};

/**
 * Gets the encoded API key from localStorage
 * Does not decode the key, just returns the Base64 encoded version
 * @returns The Base64 encoded API key or empty string if not found
 */
export const getEncodedApiKey = (): string => {
  if (typeof window === "undefined") {
    return "";
  }

  return localStorage.getItem("CHANGEDETECTION_API_KEY") || "";
};

/**
 * Gets the base URL for the changedetection.io service
 * @returns The base URL for the changedetection.io service
 */
export const getChangeDetectionBaseUrl = (): string => {
  // In the browser context
  if (typeof window !== "undefined") {
    // Check for a URL stored in localStorage first (if available in the future)
    const localUrl = localStorage.getItem("CHANGEDETECTION_URL");
    if (localUrl) return localUrl;
  }
  
  // Fallback to the environment variable or default
  return process.env.NEXT_PUBLIC_CHANGEDETECTION_URL || "http://localhost:8080";
};
