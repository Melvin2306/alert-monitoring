import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "ALERT - Automated Leak Examination and Reporting Tool",
    short_name: "ALERT",
    description:
      "Automated Leak Examination and Reporting Tool. Automated website change detection and alerting system with Tor network capabilities",
    start_url: "/",
    display: "standalone",
    background_color: "#ffffff",
    theme_color: "#000000",
    icons: [
      {
        src: "/alert-logo.png",
        sizes: "any",
        type: "image/png",
      },
    ],
  };
}
