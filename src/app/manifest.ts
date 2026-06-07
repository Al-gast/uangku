import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "UangKu",
    short_name: "UangKu",
    description:
      "Aplikasi personal finance untuk mencatat cashflow, budget, aset, dan net worth.",
    start_url: "/dashboard",
    scope: "/",
    display: "standalone",
    background_color: "#f4f7f5",
    theme_color: "#15966a",
    orientation: "portrait-primary",
    categories: ["finance", "productivity"],
    icons: [
      {
        src: "/icons/uangku-192.png",
        sizes: "192x192",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/uangku-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "any",
      },
      {
        src: "/icons/uangku-maskable-512.png",
        sizes: "512x512",
        type: "image/png",
        purpose: "maskable",
      },
    ],
  };
}
