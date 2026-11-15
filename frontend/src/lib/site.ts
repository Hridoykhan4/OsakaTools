// Brand facts used across the site. Statements about incorporation, manufacturing
// origin, trademarks or certifications are NOT hard-coded here: they are rendered only
// from verified documents managed in the dashboard (Quality & Documentation).
export const site = {
  name: "OSAKA TOOL",
  shortName: "Osaka Tool",
  kana: "オーサカツール",
  tagline: "Precision instruments for professionals worldwide",
  url: (process.env.NEXT_PUBLIC_SITE_URL || "https://osakatool.com").replace(/\/$/, ""),
  indexable: process.env.SITE_INDEXABLE === "true",
  email: process.env.NEXT_PUBLIC_CONTACT_EMAIL || "sales@osakatool.com",
  description:
    "OSAKA TOOL supplies electrical test and measurement instruments, electronics laboratory equipment, industrial tools and documented medical diagnostic devices to professional buyers worldwide, with technical specifications, datasheets and RFQ support.",
  keywords: [
    "OSAKA TOOL", "Osaka Tool", "digital multimeter supplier", "clamp meter", "insulation tester", "oscilloscope",
    "soldering station", "industrial measurement instruments", "test and measurement equipment", "blood pressure monitor supplier",
    "pulse oximeter supplier", "B2B instrument sourcing",
  ],
} as const;

export const NAV = [
  { href: "/products", label: "Products" },
  { href: "/industries", label: "Industries" },
  { href: "/technology", label: "Technology" },
  { href: "/quality", label: "Quality" },
  { href: "/distribution", label: "Distribution" },
  { href: "/resources", label: "Resources" },
  { href: "/about", label: "About" },
] as const;

export const INDUSTRIES = [
  { slug: "electrical-contracting", name: "Electrical contracting", icon: "zap", categories: ["digital-multimeters", "clamp-meters", "insulation-voltage-testers"],
    text: "Installation verification, fault finding and periodic inspection, using instruments matched to the measurement category of every task." },
  { slug: "industrial-maintenance", name: "Industrial maintenance", icon: "factory", categories: ["clamp-meters", "insulation-voltage-testers", "pressure-measurement"],
    text: "Motor and drive diagnostics, insulation trending and pressure checks that keep production lines running." },
  { slug: "electronics-rd", name: "Electronics R&D and repair", icon: "cpu", categories: ["oscilloscopes", "soldering-repair", "digital-multimeters"],
    text: "Bench instruments and ESD-safe tools for design validation, rework and device service centres." },
  { slug: "healthcare", name: "Healthcare & pharmacies", icon: "heart-pulse", categories: ["blood-pressure-monitors", "pulse-oximeters", "digital-thermometers", "blood-glucose-monitors"],
    text: "Monitoring devices supplied only into markets where their registration is documented." },
  { slug: "facilities-hvac", name: "Facilities & HVAC", icon: "building", categories: ["environmental-monitoring", "clamp-meters"],
    text: "Temperature, humidity, air flow and electrical load measurement for commissioning and service." },
  { slug: "automotive-fleet", name: "Automotive & fleet", icon: "truck", categories: ["air-compressors-inflators", "digital-multimeters"],
    text: "Portable inflation, battery and electrical diagnostics for workshops and fleet service teams." },
] as const;
