import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "UangKu",
    template: "%s | UangKu",
  },
  description: "Teman finansial untuk cashflow, aset, dan net worth kamu.",
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
