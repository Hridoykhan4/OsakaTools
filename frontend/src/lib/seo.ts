import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { site } from "./site";

export const absoluteUrl = (path = "/") => new URL(path, `${site.url}/`).href;
export const entityId = `${site.url}/#organization`;
export const websiteId = `${site.url}/#website`;

export function descriptionText(value: string | undefined, fallback: string = site.description) {
  const text = (value || fallback).replace(/<[^>]*>/g, " ").replace(/[#*_`>]/g, "").replace(/\s+/g, " ").trim();
  return text.length > 160 ? `${text.slice(0, 157).replace(/\s+\S*$/, "")}…` : text;
}

export function pageMetadata(path: string, title: string, description: string, opts: { image?: string; noindex?: boolean; canonical?: string } = {}): Metadata {
  const url = opts.canonical || absoluteUrl(path);
  const summary = descriptionText(description);
  const image = opts.image || absoluteUrl(`/og?title=${encodeURIComponent(title)}`);
  // Staging is never indexable; individual pages can opt out in production.
  const robots = !site.indexable ? { index: false, follow: false } : opts.noindex ? { index: false, follow: true } : null;
  return {
    title,
    description: summary,
    alternates: { canonical: url },
    ...(robots ? { robots } : {}),
    openGraph: { type: "website", siteName: site.name, url, title: `${title} | ${site.name}`, description: summary, images: [{ url: image, width: 1200, height: 630, alt: title }] },
    twitter: { card: "summary_large_image", title: `${title} | ${site.name}`, description: summary, images: [image] },
  };
}

export function pageNumber(raw?: string | string[]) {
  const value = Array.isArray(raw) ? raw[0] : raw;
  if (value === undefined || value === "") return 1;
  if (!/^[1-9]\d{0,4}$/.test(value)) notFound();
  return Number(value);
}

export const serializeJsonLd = (value: unknown) => JSON.stringify(value).replace(/</g, "\\u003c");

export function breadcrumbSchema(items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "BreadcrumbList",
    itemListElement: items.map((item, index) => ({ "@type": "ListItem", position: index + 1, name: item.name, item: absoluteUrl(item.path) })) };
}

export function collectionSchema(path: string, name: string, items: { name: string; path: string }[]) {
  return { "@context": "https://schema.org", "@type": "CollectionPage", "@id": `${absoluteUrl(path)}#webpage`, url: absoluteUrl(path), name,
    isPartOf: { "@id": websiteId }, about: { "@id": entityId },
    mainEntity: { "@type": "ItemList", numberOfItems: items.length,
      itemListElement: items.map((item, i) => ({ "@type": "ListItem", position: i + 1, name: item.name, url: absoluteUrl(item.path) })) } };
}
