import type { Metadata, Viewport } from "next";
import "./globals.css";
import ServiceWorkerRegister from "@/components/ServiceWorkerRegister";

export const viewport: Viewport = {
  themeColor: "#0f172a",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
};

export const metadata: Metadata = {
  title: "StockFlow - Inventory & Billing",
  description: "Modern POS and Inventory Management System",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "StockFlow",
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: "/icons/icon.svg",
    shortcut: "/icons/icon-192x192.png",
    apple: "/icons/apple-touch-icon.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased font-sans">
        <ServiceWorkerRegister />
        {children}
      </body>
    </html>
  );
}
