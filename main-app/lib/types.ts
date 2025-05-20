/**
 * Type definitions for the dashboard
 */

export type Email = {
  id: string;
  email: string;
  createdAt: string;
};

export type Url = {
  id: string;
  url: string;
  title?: string;
  lastChecked?: string | null;
  lastChanged?: string | null;
  status?: "unchanged" | "changed" | "error" | "pending";
  errorText?: string | null;
};

export type Keyword = {
  id: string;
  keyword: string;
  category?: string;
  createdAt: string;
};
