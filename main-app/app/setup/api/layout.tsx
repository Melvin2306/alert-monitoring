import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup: API",
  description: "Connect your application to the API with this setup guide",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
