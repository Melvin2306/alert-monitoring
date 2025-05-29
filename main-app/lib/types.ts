/**
 * Shared type definitions for the frontend application
 * This file contains all custom types and interfaces used across components and pages
 */

// =============================================================================
// CORE DATA TYPES
// =============================================================================

/**
 * Represents an email address entity for notifications
 */
export type Email = {
  /** Unique identifier for the email */
  id: string;
  /** The email address */
  email: string;
  /** ISO timestamp when the email was created */
  createdAt: string;
};

/**
 * Represents a URL being monitored for changes
 */
export type Url = {
  /** Unique identifier for the URL */
  id: string;
  /** The URL being monitored */
  url: string;
  /** Optional title/name for the URL */
  title?: string;
  /** ISO timestamp of when the URL was last checked */
  lastChecked?: string | null;
  /** ISO timestamp of when the URL last changed */
  lastChanged?: string | null;
  /** Current status of the URL monitoring */
  status?: "unchanged" | "changed" | "error" | "pending";
  /** Error message if the last check failed */
  errorText?: string | null;
};

/**
 * Represents a keyword used for monitoring content changes
 */
export type Keyword = {
  /** Unique identifier for the keyword */
  id: string;
  /** The keyword text to search for */
  keyword: string;
  /** Optional category to group keywords */
  category?: string;
  /** ISO timestamp when the keyword was created */
  createdAt: string;
};

// =============================================================================
// COMPONENT PROP INTERFACES
// =============================================================================

/**
 * Props for the EmailsTab component
 */
export interface EmailsTabProps {
  /** Array of email entities to display */
  emails: Email[];
  /** Whether the component is in a loading state */
  loading: boolean;
  /** Error message to display, if any */
  error: string;
  /** Function to format date strings for display */
  formatDate: (dateString: string | null | undefined) => string;
  /** Function to confirm deletion of entities */
  confirmDelete: (type: "email" | "url" | "keyword", id: string) => void;
}

/**
 * Props for the UrlsTab component
 */
export interface UrlsTabProps {
  /** Array of URL entities to display */
  urls: Url[];
  /** Whether the component is in a loading state */
  loading: boolean;
  /** Error message to display, if any */
  error: string;
  /** Function to format date strings for display */
  formatDate: (dateString: string | null | undefined) => string;
  /** Function to get color based on URL status */
  getStatusColor: (status?: string) => string;
  /** Function to refresh all URLs */
  handleRefreshAllUrls: () => Promise<void>;
  /** Function to refresh a specific URL by ID */
  handleRefreshUrl: (id: string) => Promise<void>;
  /** Function to confirm deletion of entities */
  confirmDelete: (type: "email" | "url" | "keyword", id: string) => void;
}

/**
 * Props for the KeywordTab component
 */
export interface KeywordTabProps {
  /** Array of keyword entities to display */
  keywords: Keyword[];
  /** Whether the component is in a loading state */
  loading: boolean;
  /** Error message to display, if any */
  error: string;
  /** Function to format date strings for display */
  formatDate: (dateString: string | null | undefined) => string;
  /** Function to confirm deletion of entities */
  confirmDelete: (type: "email" | "url" | "keyword", id: string) => void;
}

/**
 * Props for the FormWrapper component that wraps form submissions
 */
export interface FormWrapperProps {
  /** Title to display for the form */
  title: string;
  /** React children to render inside the form */
  children: React.ReactNode;
  /** Function to handle form submission */
  onSubmit: () => Promise<Response>;
  /** Whether the form is currently being submitted */
  isSubmitting: boolean;
  /** Message to display while loading */
  loadingMessage: string;
  /** Message to display on successful submission */
  successMessage: string;
  /** Message to display on error */
  errorMessage: string;
  /** Text for the submit button */
  submitButtonText: string;
  /** Whether the form is valid and can be submitted */
  isValid?: boolean;
}

/**
 * Props for the DeleteConfirmationDialog component
 */
export interface DeleteConfirmationDialogProps {
  /** Whether the dialog is open */
  isOpen: boolean;
  /** Function to handle dialog open state changes */
  onOpenChange: (open: boolean) => void;
  /** Function to handle cancellation */
  onCancel: () => void;
  /** Function to handle deletion confirmation */
  onDelete: () => void;
  /** Optional title for the dialog */
  title?: string;
  /** Optional description for the dialog */
  description?: string;
}

// =============================================================================
// SMTP CONFIGURATION TYPES
// =============================================================================

/**
 * Response interface for SMTP configuration status
 */
export interface SMTPStatusResponse {
  /** Whether SMTP is properly configured */
  isConfigured: boolean;
  /** SMTP server hostname */
  smtp_host: string;
  /** SMTP server port number */
  smtp_port: number;
  /** SMTP username for authentication */
  smtp_user: string;
  /** Email address to use as sender */
  smtp_from: string;
  /** Whether to use secure connection (SSL/TLS) */
  smtp_secure: boolean;
  /** List of required SMTP variables that are missing */
  missingVariables: string[];
  /** List of SMTP variables that are configured */
  configuredVariables: string[];
}

// =============================================================================
// SORTING AND FILTERING TYPES
// =============================================================================

/** Available fields for sorting emails */
export type EmailSortField = "email" | "createdAt";

/** Available fields for sorting URLs */
export type UrlSortField = "url" | "title" | "lastChecked" | "lastChanged" | "status";

/** Available fields for sorting keywords */
export type KeywordSortField = "keyword" | "category" | "createdAt";

/** Sort direction options */
export type SortDirection = "asc" | "desc";

// =============================================================================
// FORM VALIDATION TYPES
// =============================================================================

/**
 * Form values for email input forms
 */
export type EmailFormValues = {
  /** The email address value */
  email: string;
};

/**
 * Form values for URL input forms
 */
export type UrlFormValues = {
  /** The URL value */
  url: string;
  /** Optional title for the URL */
  title?: string;
};

/**
 * Form values for keyword input forms
 */
export type KeywordFormValues = {
  /** The keyword text */
  keyword: string;
  /** Optional category for grouping */
  category?: string;
};

// =============================================================================
// UTILITY TYPES
// =============================================================================

/** Available entity types for CRUD operations */
export type EntityType = "email" | "url" | "keyword";

/** URL monitoring status types */
export type StatusType = "unchanged" | "changed" | "error" | "pending";
