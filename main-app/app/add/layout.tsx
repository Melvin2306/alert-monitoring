import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add",
  description: "Add URLs, emails, or keywords to monitor",
};

export default function AddLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
