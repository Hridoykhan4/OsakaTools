import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import FontLoader from "@/components/FontLoader";
import { site } from "@/lib/site";

// Geist: an engineered neo-grotesk for every role; Geist Mono only for measured values.
const geist = Geist({ subsets: ["latin"], variable: "--font-geist", display: "swap" });
const geistMono = Geist_Mono({ subsets: ["latin"], variable: "--font-geist-mono", display: "swap", weight: ["400", "500"] });

export const viewport: Viewport = { themeColor: "#f4f5f6", width: "device-width", initialScale: 1 };

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
    <html lang="en" suppressHydrationWarning className={`${geist.variable} ${geistMono.variable}`}>
      <head>
        {/* Marks the document as scripted before first paint, so choreographed elements can start hidden. */}
        <script dangerouslySetInnerHTML={{ __html: "document.documentElement.classList.add('js')" }} />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link rel="preconnect" href="https://res.cloudinary.com" />
      </head>
      <body className="min-h-screen antialiased"><FontLoader />{children}</body>
    </html>
  );
}
