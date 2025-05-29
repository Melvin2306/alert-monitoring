/**
 * Functions for keyword-related operations
 */
import pool from "./db";
import { KeywordInfo, KeywordMatch } from "./types/changeDetection";
import { NextResponse } from "next/server";

/**
 * Fetch all keywords from the database
 * @returns {Promise<KeywordInfo[] | NextResponse>} - Keywords or error response
 */
export async function fetchKeywords(): Promise<KeywordInfo[] | NextResponse> {
  try {
    const keywordsResult = await pool.query(
      "SELECT id, keyword, category FROM keyword ORDER BY keyword"
    );

    return keywordsResult.rows as KeywordInfo[];
  } catch (dbError) {
    console.error("Database error fetching keywords:", dbError);
    return NextResponse.json(
      { message: "Failed to fetch keywords from database" },
      { status: 500 }
    );
  }
}

/**
 * Helper function to check if text contains any of the provided keywords
 * @param {string} text - The text to check
 * @param {Array<KeywordInfo>} keywords - Array of keyword objects
 * @returns {Array<KeywordInfo>} - Array of matched keywords
 */
export function findKeywordsInText(text: string, keywords: Array<KeywordInfo>): Array<KeywordInfo> {
  if (!text || typeof text !== "string") {
    return [];
  }

  // Clean the text to improve matching
  const lowerCaseText = text
    .toLowerCase()
    .replace(/<[^>]*>/g, " ") // Remove HTML tags
    .replace(/\s+/g, " ") // Normalize whitespace
    .trim();

  return keywords.filter((keywordObj) => {
    // Skip empty keywords
    if (!keywordObj.keyword || typeof keywordObj.keyword !== "string") {
      return false;
    }

    const keywordLower = keywordObj.keyword.toLowerCase().trim();

    // Check for exact match
    if (lowerCaseText.includes(keywordLower)) {
      return true;
    }

    // Check for word boundary matches to avoid partial word matches
    // For example, searching for "bank" shouldn't match "bankrupt" but should match "bank account"
    const wordBoundaryRegex = new RegExp(`\\b${escapeRegExp(keywordLower)}\\b`, "i");
    if (wordBoundaryRegex.test(lowerCaseText)) {
      return true;
    }

    return false;
  });
}

/**
 * Escapes special characters in a string for use in a regular expression
 * @param {string} string - The string to escape
 * @returns {string} - The escaped string
 */
function escapeRegExp(string: string): string {
  return string.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
}

/**
 * Extract context around keywords in text
 * @param {string} snapshotText - The text to extract context from
 * @param {Array<KeywordInfo>} matchedKeywords - Array of matched keyword objects
 * @returns {Array<KeywordMatch>} - Array of keyword matches with context
 */
export function extractKeywordContexts(
  snapshotText: string,
  matchedKeywords: Array<KeywordInfo>
): Array<KeywordMatch> {
  // Clean the HTML once for performance
  const cleanedText = snapshotText
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, " ") // Remove script blocks
    .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, " ") // Remove style blocks
    .replace(/<[^>]*>/g, " ") // Replace remaining HTML tags with space
    .replace(/\s+/g, " ") // Replace multiple spaces with single space
    .trim();

  const lowerCleanedText = cleanedText.toLowerCase();

  return matchedKeywords.map((keywordObj) => {
    const keyword = keywordObj.keyword;
    const keywordLower = keyword.toLowerCase();

    // Find the position of the keyword in the text
    let keywordIndex = lowerCleanedText.indexOf(keywordLower);

    // Try to find word boundary match if simple match fails
    if (keywordIndex === -1) {
      const regex = new RegExp(`\\b${escapeRegExp(keywordLower)}\\b`, "i");
      const match = regex.exec(lowerCleanedText);
      if (match) {
        keywordIndex = match.index;
      }
    }

    if (keywordIndex === -1) {
      return {
        keyword: keywordObj.keyword,
        keywordId: keywordObj.id,
        category: keywordObj.category,
        context: "",
      };
    }

    // Extract a larger context (100 characters before and after)
    const contextStart = Math.max(0, keywordIndex - 100);
    const contextEnd = Math.min(cleanedText.length, keywordIndex + keyword.length + 100);
    let context = cleanedText.substring(contextStart, contextEnd);

    // Add ellipsis if we truncated the context
    if (contextStart > 0) {
      context = "..." + context;
    }
    if (contextEnd < cleanedText.length) {
      context = context + "...";
    }

    // Highlight the keyword in the context (for HTML emails)
    const highlightedContext = context.replace(
      new RegExp(escapeRegExp(keyword), "gi"),
      (match) => `<mark>${match}</mark>`
    );

    return {
      keyword: keywordObj.keyword,
      keywordId: keywordObj.id,
      category: keywordObj.category,
      context: context,
      highlightedContext: highlightedContext,
    };
  });
}
