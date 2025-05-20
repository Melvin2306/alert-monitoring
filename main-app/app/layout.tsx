import Footer from "@/components/Footer";
import Header from "@/components/NavigationHeader";
import { Toaster } from "@/components/ui/sonner";
import type { Metadata, Viewport } from "next";
import { ThemeProvider } from "../components/ThemeProvider";
import "./globals.css";

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: {
    template: "%s | ALERT",
    default: "ALERT - Automated Change Detection",
  },
  description:
    "Automated website change detection and alerting system with Tor network capabilities",
  applicationName: "ALERT",
  authors: [{ name: "ALERT Team" }],
  generator: "Next.js",
  keywords: ["website monitoring", "change detection", "tor", "alerts", "privacy"],
  referrer: "origin-when-cross-origin",
  creator: "ALERT Team",
  publisher: "ALERT",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  metadataBase: new URL(process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000"),
  openGraph: {
    title: "ALERT - Automated Change Detection",
    description: "Monitor website changes securely through the Tor network",
    url: process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000",
    siteName: "ALERT",
    locale: "en_US",
    type: "website",
    images: [
      {
        url: "/alert-logo.png",
        width: 800,
        height: 600,
        alt: "ALERT Logo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "ALERT - Automated Change Detection",
    description: "Monitor website changes securely through the Tor network",
    images: ["/alert-logo.png"],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head />
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <div className="flex min-h-screen flex-col">
            <Header />
            <main className="flex-1">{children}</main>
            <Footer />
          </div>
          <Toaster richColors />
        </ThemeProvider>
      </body>
    </html>
  );
}
