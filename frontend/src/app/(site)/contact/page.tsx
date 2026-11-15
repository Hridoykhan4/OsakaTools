import Link from "next/link";
import { ClipboardList, Handshake, Mail, Search } from "lucide-react";
import InquiryForm from "@/components/InquiryForm";
import { PageHero } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";

export const metadata = pageMetadata("/contact", "Contact", "Contact OSAKA TOOL sales and engineering for quotations, product sourcing, documentation and distribution partnerships.");

const ROUTES = [
  { icon: ClipboardList, title: "Quotations", text: "Listed products, volumes and project supply.", href: "/rfq", cta: "Start an RFQ" },
  { icon: Search, title: "Sourcing", text: "Unlisted models or equivalents to a specification.", href: "/rfq", cta: "Describe the need" },
  { icon: Handshake, title: "Partnerships", text: "Regional distribution and service partners.", href: "/distribution", cta: "Partner with us" },
];

export default function Contact() {
  return (
    <>
      <PageHero eyebrow="Talk to us" title="Contact sales & engineering" kanji="連絡" crumbs={[{ name: "Contact", path: "/contact" }]}
        intro="Tell us what you are measuring, building or supplying. A specialist replies by email, usually within one business day." />
      <div className="shell mt-14 grid gap-10 lg:grid-cols-12">
        <aside className="space-y-4 lg:col-span-4">
          <a href={`mailto:${site.email}`} className="card flex items-center gap-4 p-5 transition hover:border-ink">
            <Mail className="h-6 w-6 text-beni" strokeWidth={1.4} />
            <span><span className="block text-xs uppercase tracking-wide text-faint">Email</span><span className="font-mono">{site.email}</span></span>
          </a>
          {ROUTES.map(({ icon: Icon, title, text, href, cta }) => (
            <div key={title} className="card p-5">
              <Icon className="h-5 w-5 text-beni" strokeWidth={1.4} />
              <p className="mt-3 font-semibold">{title}</p>
              <p className="mt-1 text-sm text-mute">{text}</p>
              <Link href={href} className="mt-3 inline-block text-sm font-medium text-beni hover:underline">{cta}</Link>
            </div>
          ))}
        </aside>
        <section className="card p-6 sm:p-10 lg:col-span-8" aria-label="Contact form"><InquiryForm type="contact" /></section>
      </div>
    </>
  );
}
