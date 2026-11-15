import type { Metadata, Viewport } from "next";
import { JetBrains_Mono, Shippori_Mincho_B1, Zen_Kaku_Gothic_New } from "next/font/google";
import "./globals.css";
import { site } from "@/lib/site";

// Shippori Mincho for display type (Japanese Mincho serif with matching Latin);
// Zen Kaku Gothic New for reading text; JetBrains Mono only for specification values.
const shippori = Shippori_Mincho_B1({ subsets: ["latin"], variable: "--font-shippori", display: "swap", weight: ["500", "600", "800"] });
const zen = Zen_Kaku_Gothic_New({ subsets: ["latin"], variable: "--font-zen", display: "swap", weight: ["400", "500", "700"] });
const jetbrains = JetBrains_Mono({ subsets: ["latin"], variable: "--font-jetbrains", display: "swap", weight: ["400", "500"] });

export const viewport: Viewport = { themeColor: "#fbfaf7", width: "device-width", initialScale: 1 };

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
    <html lang="en" className={`${shippori.variable} ${zen.variable} ${jetbrains.variable}`}>
      <head>
        {/* Japanese glyphs for kanji marks: Google serves them as unicode-range slices, so only used characters download. */}
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        {/* eslint-disable-next-line @next/next/no-page-custom-font -- root App Router layout, loads on every page */}
        <link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Shippori+Mincho+B1:wght@600;800&display=swap" />
      </head>
      <body className="min-h-screen antialiased">{children}</body>
    </html>
  );
}
