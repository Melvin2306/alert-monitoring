import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Keyword",
  description: "Edit a keyword you're monitoring",
};

export default function EditKeywordLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
