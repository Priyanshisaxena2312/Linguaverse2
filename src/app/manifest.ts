import { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Linguaverse",
    short_name: "Linguaverse",
    description: "The complete platform for all your language needs.",
    start_url: "/",
    display: "standalone",
    orientation: "portrait",
    background_color: "#1d1d1b",
    theme_color: "#ffffff",
    icons: [
      {
        src: "/icon-192x192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "maskable",
      },
      {
        src: "/icon-512x512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
    ],
  };
}
