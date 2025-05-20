import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Keyword",
  description: "Add keywords to monitor for changes",
};

export default function AddKeywordsLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
