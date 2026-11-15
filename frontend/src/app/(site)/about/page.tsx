import Link from "next/link";
import { ArrowRight, BadgeCheck } from "lucide-react";
import { Mark } from "@/components/brand";
import { CtaBand, PageHero, SectionHead } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import { site } from "@/lib/site";
import type { CompanyDocument } from "@/lib/types";

export const metadata = pageMetadata("/about", "About OSAKA TOOL",
  "OSAKA TOOL is an instruments and technical products brand serving professional buyers worldwide with specification-first listings, documented claims and engineering support.");

const VALUES = [
  ["Specification first", "We list products with structured technical data and real model numbers, so decisions are based on facts."],
  ["Documented claims", "Origin, certification and registration statements are published only with verified evidence."],
  ["Honest attribution", "Every product names its actual manufacturer. Trademarks remain with their owners."],
  ["Long-term support", "We prefer instruments with available spares, accessories and calibration support."],
];

export default async function About() {
  const { documents } = await safe(api.documents(), { documents: [] as CompanyDocument[] });
  const corporate = documents.filter((d) => ["incorporation", "trademark"].includes(d.type));
  return (
    <>
      <PageHero eyebrow="Company" title="Precision as a working habit." kanji="大阪" crumbs={[{ name: "About", path: "/about" }]}
        intro={`${site.name} brings test and measurement instruments, laboratory equipment, industrial tools and medical diagnostic devices to professional buyers, with the data and documentation that serious procurement requires.`} />

      <section className="shell mt-20 grid gap-12 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="card grid-paper flex aspect-square items-center justify-center">
            <Mark className="h-1/2 w-1/2 text-ink" />
          </div>
        </div>
        <div className="space-y-6 text-lg leading-relaxed text-ink-2 lg:col-span-7">
          <p className="eyebrow">Our approach</p>
          <p>The brand takes its name and its sensibility from Osaka, a city long associated with trade, manufacturing and practical engineering. We apply that sensibility to how we work: careful selection, exact description and dependable supply.</p>
          <p>Engineers, contractors, laboratories and healthcare buyers come to us for instruments they can specify with confidence. We support them with structured specifications, comparison tools, technical guidance and a sourcing desk for models that are not yet listed.</p>
          <p>We do not ask buyers to take claims on trust. Company records, trademark registrations, certificates and market registrations are published in our <Link href="/quality" className="text-beni underline underline-offset-4">documentation library</Link> as each one is verified.</p>
        </div>
      </section>

      <section className="shell mt-24">
        <SectionHead eyebrow="Principles" title="What we stand behind" />
        <div className="mt-10 grid gap-px overflow-hidden rounded-sm border border-line bg-line sm:grid-cols-2">
          {VALUES.map(([t, d], i) => (
            <div key={t} className="reveal bg-paper p-8">
              <span className="font-mono text-sm text-beni">{String(i + 1).padStart(2, "0")}</span>
              <h3 className="mt-4 text-xl font-semibold">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-mute">{d}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="shell mt-24">
        <SectionHead eyebrow="Company records" title="Verified corporate documents" />
        {corporate.length ? (
          <ul className="mt-8 grid gap-3 md:grid-cols-2">
            {corporate.map((d) => (
              <li key={d._id} className="card flex items-start gap-3 p-5">
                <BadgeCheck className="h-5 w-5 shrink-0 text-ok" />
                <div><p className="font-semibold">{d.title}</p><p className="mt-1 text-sm text-mute">{[d.issuer, d.jurisdiction, d.number].filter(Boolean).join(" · ")}</p></div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="mt-6 max-w-2xl text-mute">Corporate and trademark documents will be listed here after verification.</p>
        )}
        <Link href="/quality" className="mt-8 inline-flex items-center gap-2 text-sm font-medium">Open the documentation library <ArrowRight className="h-4 w-4" /></Link>
      </section>
      <CtaBand />
    </>
  );
}
