export interface Pagination { page: number; limit: number; total: number; pages: number }
export interface Image { url: string; publicId?: string; alt?: string }
export interface Seo { title?: string; description?: string; canonical?: string; noindex?: boolean }
export type ProductStatus = "draft" | "review" | "published" | "archived";

export interface Category {
  _id: string; name: string; slug: string; tagline?: string; description?: string; guide?: string; icon?: string;
  image?: Image; parent?: string | { _id: string; name: string; slug: string } | null; order: number; isMedical?: boolean;
  productCount?: number; seo?: Seo; updatedAt: string;
}

export interface Brand { _id: string; name: string; slug: string; kind: "house" | "manufacturer" | "distributor"; country?: string;
  website?: string; description?: string; verified?: boolean; productCount?: number }

export interface Spec { group: string; label: string; value: string; unit?: string; filterable?: boolean }
export interface ProductDocument { title: string; kind: string; url: string; publicId?: string; public?: boolean }
export interface Market { region: string; authority?: string; registrationNo?: string; status: "not-applicable" | "pending" | "registered" | "not-eligible"; evidence?: string | null }

export interface Product {
  _id: string; name: string; slug: string; shortDescription: string; description: string;
  category: Category | string; brand?: Brand | string | null; manufacturer: string; modelNumber: string; sku: string; gtin?: string;
  countryOfOrigin?: string; originVerified?: boolean; privateLabel?: { status: "none" | "pending" | "approved"; evidence?: string | null };
  images: Image[]; specifications: Spec[]; features: string[]; applications: string[]; inBox: string[]; documents: ProductDocument[];
  certifications: string[]; warranty?: string; moq?: number; leadTime?: string; regions: string[];
  regulatory?: { isMedical: boolean; deviceClass?: string; intendedUse?: string; markets: Market[] };
  seo?: Seo; status: ProductStatus; published: boolean; featured: boolean; publishedAt?: string; updatedAt: string; createdAt?: string;
  source?: { system: string; sourceId?: string; url?: string; importedAt?: string }; reviewNotes?: string[];
}

export interface Facets {
  manufacturers: { name: string; count: number }[];
  brands: { name: string; slug: string; count: number }[];
  specs: { label: string; values: { value: string; count: number }[] }[];
}

export interface Article {
  _id: string; title: string; slug: string; excerpt: string; content?: string; author: string; category: string; tags: string[];
  relatedCategories: string[]; readingMinutes: number; coverImage?: Image; seo?: Seo; published: boolean; publishedAt: string; updatedAt: string;
}

export interface CompanyDocument {
  _id: string; title: string; type: string; issuer?: string; number?: string; jurisdiction?: string; issuedAt?: string; expiresAt?: string;
  file?: { url: string; publicId?: string; format?: string }; status: "pending" | "verified" | "rejected" | "expired"; public: boolean;
  summary?: string; verifiedBy?: string; verifiedAt?: string; createdAt: string;
}

export interface InquiryItem { product?: string | null; name: string; sku?: string; quantity: number; notes?: string }
export interface Inquiry {
  _id: string; type: "contact" | "rfq" | "sourcing" | "distribution"; name: string; email: string; phone?: string; company?: string;
  country?: string; subject?: string; message?: string; items: InquiryItem[]; status: string; read: boolean; assignedTo?: string;
  organization?: { _id: string; name: string } | null; notes: { by: string; text: string; at: string }[]; sourcePage?: string; createdAt: string;
}

export interface Organization { _id: string; name: string; country?: string; website?: string; segment: string;
  contacts: { name: string; email: string; phone?: string }[]; notes?: string; inquiryCount: number; lastInquiryAt?: string | null; updatedAt: string }

export interface AuditEntry { _id: string; actor: string; role: string; action: string; entity: string; entityId: string; summary: string;
  changes?: Record<string, { from: unknown; to: unknown }>; ip?: string; createdAt: string }

export interface ImportJob { _id: string; source: string; mode: "preview" | "commit"; status: string; startedBy: string;
  stats: Record<"fetched" | "relevant" | "created" | "updated" | "unchanged" | "skipped" | "errors", number>;
  items: { sourceId: string; name: string; action: string; category?: string; reason?: string }[];
  errorLog: { sourceId: string; message: string }[]; createdAt: string; finishedAt?: string }

export interface AdminUser { _id: string; username: string; name?: string; email?: string; role: string; active: boolean; lastLoginAt?: string; createdAt: string }
export interface Session { id: string; username: string; name?: string; role: string; permissions: string[] }
export interface SiteSettings {
  announcement: { text: string; href: string; active: boolean };
  hero: { kicker: string; title: string; subtitle: string; kanji: string };
  contact: { email: string; phone: string; whatsapp: string; address: string; hours: string };
  social: { linkedin: string; facebook: string; instagram: string; youtube: string; x: string };
  home: { featuredCategories: string[]; statement: string };
}
