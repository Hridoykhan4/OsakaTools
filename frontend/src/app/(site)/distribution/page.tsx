import { Boxes, FileCheck2, Handshake, PackageCheck } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { PageHero, SectionHead } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/distribution", "Global distribution",
  "Work with OSAKA TOOL as a buyer, project contractor or distribution partner: consolidated sourcing, documentation and delivery coordination for international customers.");

const MODELS = [
  { icon: PackageCheck, title: "Direct project supply", text: "Consolidated quotations for contractors and facilities, with the documentation each project needs." },
  { icon: Boxes, title: "Bulk & repeat orders", text: "Framework pricing and scheduled deliveries for maintenance teams and institutional buyers." },
  { icon: Handshake, title: "Distribution partners", text: "Regional resellers and service partners supplying OSAKA TOOL-listed products in their markets." },
  { icon: FileCheck2, title: "Regulated products", text: "Medical and safety-critical products are supplied only into markets where their registration is documented." },
];

export default function Distribution() {
  return (
    <>
      <PageHero eyebrow="Worldwide" title="Global distribution" kanji="流通" crumbs={[{ name: "Distribution", path: "/distribution" }]}
        intro="One point of contact for sourcing, documentation and delivery coordination, wherever your team works." />
      <section className="shell mt-16 grid gap-5 sm:grid-cols-2">
        {MODELS.map(({ icon: Icon, title, text }) => (
          <div key={title} className="reveal card p-8">
            <Icon className="h-7 w-7 text-beni" strokeWidth={1.4} />
            <h2 className="mt-5 text-xl font-semibold">{title}</h2>
            <p className="mt-2 text-sm leading-relaxed text-mute">{text}</p>
          </div>
        ))}
      </section>
      <section className="shell mt-20 grid gap-10 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <SectionHead eyebrow="Partnership" title="Become a distribution partner" intro="Tell us about your market, customer segments and service capability. Partner availability depends on the region and the product category." />
          <p className="mt-6 text-sm text-mute">Delivery terms, availability and regulatory eligibility are confirmed per country in each quotation.</p>
        </div>
        <div className="card p-6 sm:p-10 lg:col-span-7"><InquiryForm type="distribution" submitLabel="Send partnership inquiry" defaultMessage={"Region / countries:\nCustomer segments:\nCategories of interest:\n"} /></div>
      </section>
    </>
  );
}
