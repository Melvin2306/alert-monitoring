import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const baseUrl = process.env.NEXT_PUBLIC_WEBSITE_URL || "http://localhost:3000";

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: ["/api/", "/settings/", "/setup/"],
    },
    sitemap: `${baseUrl}/sitemap.xml`,
  };
}
