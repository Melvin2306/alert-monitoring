import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Email",
  description: "Edit an email address for receiving alerts",
};

export default function EditEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
