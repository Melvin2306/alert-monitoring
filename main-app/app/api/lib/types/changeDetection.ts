/**
 * Type definitions for changedetection.io integration
 */

// Interface for keyword match results
export interface KeywordMatch {
  keyword: string;
  keywordId: string;
  category: string | null;
  context: string;
  highlightedContext?: string; // HTML version with highlighted keywords
}

// Interface for watch match results
export type WatchMatch = {
  watchId: string;
  url: string;
  title: string;
  lastChanged: string | null;
  keywords: KeywordMatch[];
}

// Interface for keyword information from database
export type KeywordInfo = {
  id: string;
  keyword: string;
  category: string | null;
}

// Interface for watch information from changedetection.io API
export type WatchInfo = {
  url: string;
  title?: string;
  last_checked?: number;
  last_changed?: number;
  last_error?: string | boolean;
}
