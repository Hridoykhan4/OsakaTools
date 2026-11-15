import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { CtaBand, PageHero, SectionHead } from "@/components/ui";
import { pageMetadata } from "@/lib/seo";

export const metadata = pageMetadata("/technology", "Technology & engineering",
  "The engineering principles behind OSAKA TOOL product selection: measurement categories, True RMS, accuracy specifications, ESD safety and clinical validation.");

const PRINCIPLES = [
  { jp: "ものづくり", romaji: "Monozukuri", title: "The craft of making", text: "We evaluate instruments by how they are built: input protection, insulation, component quality and serviceability, not by headline features alone." },
  { jp: "改善", romaji: "Kaizen", title: "Continuous improvement", text: "Every inquiry, return and field report feeds back into what we list, how we describe it and which models we stop supplying." },
  { jp: "現地現物", romaji: "Genchi genbutsu", title: "Go and see", text: "Specifications are written for the real environment: a CAT III distribution board, a cleanroom rework bench or a pharmacy counter." },
];

const PILLARS = [
  { n: "01", title: "Safety by category", text: "Electrical instruments are specified against IEC 61010-1 measurement categories, and the full measurement chain must be rated for the task.", link: "/resources/multimeter-measurement-categories-cat-ii-iii-iv-explained" },
  { n: "02", title: "Accuracy you can read", text: "We publish accuracy as the manufacturer states it, as ±(% of reading + digits), with ranges and conditions, so buyers compare like with like.", link: "/resources/true-rms-vs-average-responding-meters" },
  { n: "03", title: "Signal integrity", text: "For oscilloscopes and probes, bandwidth, sample rate, memory depth and probe loading are treated as one measurement system.", link: "/resources/choosing-an-oscilloscope-bandwidth-sample-rate-memory" },
  { n: "04", title: "Clinical validation", text: "Medical devices are supplied only with documented registration and validation against the applicable ISO standard for the target market.", link: "/resources/blood-pressure-monitor-accuracy-and-validation" },
];

export default function Technology() {
  return (
    <>
      <PageHero eyebrow="Engineering" title="Technology & engineering" kanji="精密" crumbs={[{ name: "Technology", path: "/technology" }]}
        intro="Precision is a discipline before it is a specification. These are the principles we apply to every product we select, describe and supply." />
      <section className="shell mt-16 grid gap-px overflow-hidden rounded-3xl border border-line bg-line md:grid-cols-3">
        {PRINCIPLES.map((p) => (
          <div key={p.romaji} className="reveal bg-paper p-8 sm:p-10">
            <p className="font-jp text-4xl font-bold text-beni">{p.jp}</p>
            <p className="mt-3 font-mono text-xs uppercase tracking-[0.14em] text-faint">{p.romaji}</p>
            <h2 className="mt-6 text-xl font-semibold">{p.title}</h2>
            <p className="mt-3 text-sm leading-relaxed text-mute">{p.text}</p>
          </div>
        ))}
      </section>
      <section className="shell mt-24">
        <SectionHead eyebrow="Engineering pillars" title="What “precision” means in practice" />
        <div className="mt-12 grid gap-5 md:grid-cols-2">
          {PILLARS.map((p) => (
            <Link key={p.n} href={p.link} className="reveal group card flex gap-6 p-8 transition hover:border-ink">
              <span className="font-mono text-sm text-beni">{p.n}</span>
              <div>
                <h3 className="text-xl font-semibold">{p.title}</h3>
                <p className="mt-3 text-sm leading-relaxed text-mute">{p.text}</p>
                <p className="mt-5 inline-flex items-center gap-1 text-sm font-medium">Read the guide <ArrowUpRight className="h-4 w-4 group-hover:text-beni" /></p>
              </div>
            </Link>
          ))}
        </div>
      </section>
      <CtaBand title="Talk to an engineer before you specify." text="Share the application and the standard you work to. We will recommend instruments and the documentation to request." />
    </>
  );
}
