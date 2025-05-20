import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add Email",
  description: "Add an email address to receive monitoring alerts",
};

export default function AddEmailLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
