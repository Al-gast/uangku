import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  applicationName: "UangKu",
  title: {
    default: "UangKu",
    template: "%s | UangKu",
  },
  description:
    "Aplikasi personal finance untuk mencatat cashflow, budget, aset, dan net worth.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "UangKu",
    statusBarStyle: "default",
  },
  icons: {
    icon: [
      {
        url: "/icons/uangku-192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/icons/uangku-512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: "/icons/uangku-192.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" data-accent="emerald" suppressHydrationWarning>
      <body>{children}</body>
    </html>
  );
}
