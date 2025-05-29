/**
 * Type definitions for backend API routes
 * This file re-exports all backend types for convenience
 */

/**
 * Type definitions for backend API routes and changedetection.io integration
 * This file contains all custom types and interfaces used in API routes and server-side code
 */

// =============================================================================
// CHANGEDETECTION.IO API TYPES
// =============================================================================

/**
 * Interface for watch information from changedetection.io API
 */
export interface WatchInfo {
  url: string;
  title?: string;
  last_checked?: number; // Unix timestamp of last check
  last_changed?: number; // Unix timestamp of last detected change
  last_error?: string | boolean; // Error information if the last check failed
  uuid?: string; // Unique identifier for the watch
}

/**
 * Interface for keyword match results
 */
export interface KeywordMatch {
  keyword: string;
  keywordId: string;
  category: string | null;
  context: string;
  highlightedContext?: string; // HTML version with highlighted keywords
}

/**
 * Interface for watch match results
 */
export interface WatchMatch {
  watchId: string;
  url: string;
  title: string;
  lastChanged: string | null;
  keywords: KeywordMatch[];
}

/**
 * Interface for keyword information from database
 */
export interface KeywordInfo {
  id: string;
  keyword: string;
  category: string | null;
}

/**
 * Interface representing a change that matched our keyword criteria
 */
export interface MatchedChange {
  url: string; // URL of the monitored page
  title: string; // Title of the monitored page
  matchedKeywords: string[]; // List of keywords that were matched
  matchedText: string[]; // Snippets of text containing matched keywords
  lastChanged: string; // ISO timestamp of when the change was detected
}

// =============================================================================
// EMAIL API TYPES
// =============================================================================

/**
 * Configuration options for sending an alert email
 */
export interface SendAlertOptions extends EmailOptions {
  subject?: string;
  recipients: string[];
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  priority?: "high" | "normal" | "low";
  emailId?: string;
}

/**
 * Type for email test request body
 */
export interface EmailTestRequest {
  to: string;
  message: string;
  subject?: string;
}

/**
 * Type for email send request body
 */
export interface EmailSendRequest {
  subject: string;
  body?: string; // Legacy field for backward compatibility
  html?: string; // HTML version of the message
  text?: string; // Plain text version of the message
  email_address: string;
  cc?: string[];
  bcc?: string[];
  replyTo?: string;
  priority?: "high" | "normal" | "low";
  attachments?: Array<{
    filename?: string;
    content?: string | Buffer;
    path?: string;
    contentType?: string;
    cid?: string;
  }>;
  headers?: Record<string, string> | Array<{ key: string; value: string }>;
  // New fields for template-based emails
  useTemplate?: boolean;
  templateData?: {
    email?: string;
    findings?: Array<{
      url: string;
      keywords: string[];
      timestamp?: string;
      siteName?: string;
    }>;
  };
}

// =============================================================================
// API RESPONSE TYPES
// =============================================================================

/**
 * Standard API response wrapper
 */
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * SMTP configuration status response
 */
export interface SMTPStatusResponse {
  isConfigured: boolean;
  smtp_host: string;
  smtp_port: number;
  smtp_user: string;
  smtp_from: string;
  smtp_secure: boolean;
  missingVariables: string[];
  configuredVariables: string[];
}

// =============================================================================
// DATABASE ENTITY TYPES
// =============================================================================

/**
 * Database entity for emails
 */
export interface EmailEntity {
  id: string;
  email: string;
  created_at: string;
  updated_at?: string;
}

/**
 * Database entity for URLs
 */
export interface UrlEntity {
  id: string;
  url: string;
  title?: string;
  last_checked?: string | null;
  last_changed?: string | null;
  status?: "unchanged" | "changed" | "error" | "pending";
  error_text?: string | null;
  created_at: string;
  updated_at?: string;
}

/**
 * Database entity for keywords
 */
export interface KeywordEntity {
  id: string;
  keyword: string;
  category?: string | null;
  created_at: string;
  updated_at?: string;
}

// =============================================================================
// REQUEST BODY TYPES
// =============================================================================

/**
 * Request body for creating/updating emails
 */
export interface EmailRequestBody {
  email: string;
}

/**
 * Request body for updating emails (includes ID)
 */
export interface EmailUpdateRequestBody extends EmailRequestBody {
  id: string;
}

/**
 * Request body for creating/updating URLs
 */
export interface UrlRequestBody {
  url: string;
  title?: string;
}

/**
 * Request body for creating/updating keywords
 */
export interface KeywordRequestBody {
  keyword: string;
  category?: string;
}

// =============================================================================
// UTILITY TYPES
// =============================================================================

/**
 * Available entity types for CRUD operations
 */
export type EntityType = "email" | "url" | "keyword";

/**
 * URL status types
 */
export type StatusType = "unchanged" | "changed" | "error" | "pending";

// =============================================================================
// EMAIL BUILDER TYPES
// =============================================================================

/**
 * Interface for email template variables
 */
export interface TemplateVariables {
  email?: string;
  url?: string;
  findingTime?: string;
  keywords?: string[];
  totalFindings?: number;
  siteName?: string;
  emailId?: string;
  context?: string;
  highlightedContext?: string;
}

/**
 * Interface for email finding data
 */
export interface Finding {
  url: string;
  findingTime: string;
  keywords: string[];
  siteName?: string;
  context?: string;
  highlightedContext?: string;
}

/**
 * Interface for email building options
 */
export interface EmailOptions {
  email?: string;
  findings: Finding[];
  emailId?: string;
}

/**
 * Request body interface for sending email alerts manually
 */
export interface SendEmailRequest {
  matches?: WatchMatch[]; // Optional pre-defined matches
  checkRecent?: boolean; // Whether to check only recent changes
  hours?: number; // Timeframe for recent changes
  testMode?: boolean; // Whether to run in test mode
  testEmail?: string; // Test email to use in test mode
  customSubject?: string; // Custom email subject
}
