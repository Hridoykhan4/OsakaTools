import { PageHero } from "@/components/ui";
import RfqBuilder from "@/components/RfqBuilder";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/rfq", "Request a quote",
  "Request a quotation from OSAKA TOOL for listed products or instruments sourced to your specification. Bulk, project and distributor inquiries welcome.");

export default async function Rfq({ searchParams }: { searchParams: Promise<{ need?: string }> }) {
  const need = ((await searchParams).need || "").slice(0, 300);
  return (
    <>
      <PageHero eyebrow="Request for quotation" title="Request a quote" kanji="見積" crumbs={[{ name: "Request a quote", path: "/rfq" }]}
        intro="Add listed products, or describe what you need. We reply with availability, lead time, manufacturer details and documentation." />
      <div className="shell mt-12"><RfqBuilder need={need} /></div>
    </>
  );
}
