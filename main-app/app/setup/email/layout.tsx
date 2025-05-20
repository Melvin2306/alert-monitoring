import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup: Email",
  description: "Setup your email address with this setup guide",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
