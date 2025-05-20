import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit URL",
  description: "Edit a URL you're monitoring",
};

export default function EditUrlLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
