import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Setup",
  description: "Setup your application here",
};

export default function SetupLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
