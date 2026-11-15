import { BadgeCheck, FileText, ShieldCheck } from "lucide-react";
import { CtaBand, PageHero, SectionHead } from "@/components/ui";
import { api, safe } from "@/lib/api";
import { pageMetadata } from "@/lib/seo";
import type { CompanyDocument } from "@/lib/types";

export const metadata = pageMetadata("/quality", "Quality & documentation",
  "How OSAKA TOOL verifies certificates, test reports, market registrations and company documents before publishing them, and the verified documentation library.");

const TYPE_LABEL: Record<string, string> = {
  incorporation: "Company registration", trademark: "Trademark", certificate: "Certificate", regulatory: "Regulatory registration",
  "test-report": "Test report", datasheet: "Datasheet", "manufacturing-agreement": "Manufacturing agreement", other: "Document",
};

const PROCESS = [
  ["Collect", "Documents are received from manufacturers, test laboratories, notified bodies or registries."],
  ["Verify", "An administrator checks the document against its issuer, number, scope and validity dates."],
  ["Link", "Verified evidence is linked to the products and markets it covers."],
  ["Publish", "Only verified documents marked for publication appear here. Expired documents are withdrawn."],
];

const fmt = (d?: string) => (d ? new Date(d).toLocaleDateString("en-GB", { year: "numeric", month: "short", day: "numeric" }) : "—");

export default async function Quality() {
  const { documents } = await safe(api.documents(), { documents: [] as CompanyDocument[] });
  const groups = Object.entries(documents.reduce<Record<string, CompanyDocument[]>>((acc, d) => { (acc[d.type] ||= []).push(d); return acc; }, {}));
  return (
    <>
      <PageHero eyebrow="Evidence, not adjectives" title="Quality & documentation" kanji="品質" crumbs={[{ name: "Quality", path: "/quality" }]}
        intro="We publish a claim only when we can show the document behind it. This library lists every verified document that is available for public review." />

      <section className="shell mt-16">
        <SectionHead eyebrow="Process" title="How a document reaches this page" />
        <ol className="mt-10 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-4">
          {PROCESS.map(([t, d], i) => (
            <li key={t} className="bg-paper p-7"><span className="font-mono text-sm text-beni">{String(i + 1).padStart(2, "0")}</span><p className="mt-4 font-semibold">{t}</p><p className="mt-2 text-sm text-mute">{d}</p></li>
          ))}
        </ol>
      </section>

      <section className="shell mt-20" aria-labelledby="library">
        <SectionHead eyebrow="Library" title={`Verified documents (${documents.length})`} />
        {documents.length === 0 ? (
          <div className="card mt-8 flex items-start gap-4 p-8">
            <ShieldCheck className="h-6 w-6 shrink-0 text-ai" />
            <div>
              <p id="library" className="font-semibold">Documents are in verification.</p>
              <p className="mt-2 max-w-2xl text-sm text-mute">Company, trademark and product documents appear here as each one completes verification. To review a specific document for a purchase, request it with your quotation.</p>
            </div>
          </div>
        ) : (
          <div className="mt-8 space-y-10">
            {groups.map(([type, docs]) => (
              <div key={type}>
                <p className="eyebrow">{TYPE_LABEL[type] || type}</p>
                <ul className="mt-4 grid gap-3 md:grid-cols-2">
                  {docs.map((d) => (
                    <li key={d._id} className="card flex gap-4 p-5">
                      <FileText className="h-6 w-6 shrink-0 text-beni" strokeWidth={1.5} />
                      <div className="min-w-0 flex-1">
                        <p className="flex items-center gap-2 font-semibold">{d.title}<BadgeCheck className="h-4 w-4 text-ok" aria-label="Verified" /></p>
                        <dl className="mt-2 grid grid-cols-2 gap-x-4 gap-y-1 text-xs text-mute">
                          {d.issuer && <><dt>Issuer</dt><dd className="text-ink">{d.issuer}</dd></>}
                          {d.number && <><dt>Number</dt><dd className="font-mono text-ink">{d.number}</dd></>}
                          {d.jurisdiction && <><dt>Jurisdiction</dt><dd className="text-ink">{d.jurisdiction}</dd></>}
                          <dt>Issued</dt><dd className="text-ink">{fmt(d.issuedAt)}</dd>
                          {d.expiresAt && <><dt>Valid until</dt><dd className="text-ink">{fmt(d.expiresAt)}</dd></>}
                        </dl>
                        {d.summary && <p className="mt-3 text-sm text-mute">{d.summary}</p>}
                        {d.file?.url && <a href={d.file.url} target="_blank" rel="noopener" className="mt-3 inline-block text-sm font-medium text-beni hover:underline">View document</a>}
                      </div>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        )}
      </section>
      <CtaBand />
    </>
  );
}
