import type { Metadata, Viewport } from "next";
import { Inter_Tight, JetBrains_Mono, Noto_Sans_JP } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

const interTight = Inter_Tight({ subsets: ["latin"], variable: "--font-inter-tight", display: "swap" });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500"] });
const notoJp = Noto_Sans_JP({ subsets: ["latin"], variable: "--font-noto-jp", display: "swap", weight: ["500", "700"], preload: false });

export const viewport: Viewport = { themeColor: "#f7f5f0", width: "device-width", initialScale: 1 };

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: { default: `${site.name} — ${site.tagline}`, template: `%s | ${site.name}` },
  description: site.description,
  keywords: [...site.keywords],
  applicationName: site.name,
  robots: site.indexable ? { index: true, follow: true } : { index: false, follow: false },
  openGraph: { type: "website", siteName: site.name, url: site.url, title: `${site.name} — ${site.tagline}`, description: site.description,
    images: [{ url: "/og", width: 1200, height: 630, alt: site.name }] },
  twitter: { card: "summary_large_image", title: `${site.name} — ${site.tagline}`, description: site.description, images: ["/og"] },
  verification: {
    google: process.env.GOOGLE_SITE_VERIFICATION || undefined,
    other: process.env.BING_SITE_VERIFICATION ? { "msvalidate.01": process.env.BING_SITE_VERIFICATION } : undefined,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" className={`${interTight.variable} ${jetbrains.variable} ${notoJp.variable}`}>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
