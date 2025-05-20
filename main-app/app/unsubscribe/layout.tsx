import { type Metadata } from "next";

export const metadata: Metadata = {
  title: "Unsubscribe",
  description: "Unsubscribe from ALERT notifications",
};

export default function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
