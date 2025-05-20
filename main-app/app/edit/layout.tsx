import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit",
  description: "Edit your URLs, emails, or keywords",
};

export default function EditLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
