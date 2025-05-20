import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add URL",
  description: "Add a URL to monitor for changes through the Tor network",
  keywords: ["website monitoring", "url tracking", "tor network", "anonymous monitoring"],
};

export default function AddUrlLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
