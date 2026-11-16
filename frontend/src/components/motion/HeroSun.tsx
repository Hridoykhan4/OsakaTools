import Link from "next/link";
import { ArrowDownRight, ArrowRight } from "lucide-react";
import HeroStage from "@/components/three/HeroStage";

export interface HeroProps {
  kicker: string; title: string; subtitle: string; kanji: string;
  stats: { value: number; label: string }[];
}

// Server-rendered hero. The headline sets itself with CSS (no JavaScript on the
// critical path) while the 3D gyroscope loads after first paint.
export default function HeroSun({ kicker, title, subtitle, kanji, stats }: HeroProps) {
  let n = 0;
  return (
    <section className="relative overflow-hidden">
      <div aria-hidden className="pointer-events-none absolute inset-0 grid-paper [mask-image:radial-gradient(ellipse_at_70%_45%,black,transparent_70%)]" />
      <div className="shell relative grid min-h-[calc(100svh-4.5rem)] items-center gap-8 pb-10 pt-6 lg:grid-cols-12 lg:pb-14">
        {/* 3D stage */}
        <div className="relative order-1 aspect-square w-full lg:order-2 lg:col-span-6 lg:-mr-8">
          <div aria-hidden className="absolute bottom-[7%] left-1/2 h-[7%] w-[56%] -translate-x-1/2 rounded-[50%] bg-ink/15 blur-xl" />
          <div className="absolute inset-0"><HeroStage /></div>
          <div aria-hidden className="horizon absolute inset-x-0 bottom-[10%] h-px origin-left bg-ink/70" />
          <p aria-hidden className="vertical intro-fade absolute right-0 top-2 select-none font-mincho text-[2.6rem] font-extrabold leading-[1.04] sm:text-6xl lg:-right-6 lg:text-[5.4rem]" style={{ animationDelay: "0.9s" }}>{kanji}</p>
        </div>

        <div className="relative order-2 lg:order-1 lg:col-span-6">
          <p className="eyebrow intro-fade" style={{ animationDelay: "0.2s" }}>{kicker}</p>
          <h1 className="display mt-5 text-[3rem] leading-[0.98] sm:text-7xl xl:text-[6.6rem]">
            <span className="sr-only">{title}</span>
            <span aria-hidden>
              {title.split(" ").map((w, wi) => (
                <span key={wi} className="mr-[0.22em] inline-block overflow-hidden pb-[0.08em] align-bottom">
                  {[...w].map((c, ci) => <span key={ci} className="rise inline-block" style={{ animationDelay: `${0.25 + n++ * 0.024}s` }}>{c}</span>)}
                </span>
              ))}
            </span>
          </h1>
          <p className="intro-fade mt-7 max-w-xl text-lg leading-relaxed text-ink-2" style={{ animationDelay: "0.9s" }}>{subtitle}</p>
          <div className="intro-fade mt-9 flex flex-wrap items-center gap-3" style={{ animationDelay: "1.05s" }}>
            <Link href="/products" className="btn btn-primary">Explore the catalogue <ArrowRight className="h-4 w-4" /></Link>
            <Link href="#families" className="btn btn-ghost" aria-label="Scroll to product families"><ArrowDownRight className="h-4 w-4" /></Link>
          </div>
          <dl className="intro-fade mt-12 grid max-w-md grid-cols-3 gap-4 border-t border-line pt-6" style={{ animationDelay: "1.2s" }}>
            {stats.map((s) => (
              <div key={s.label}>
                <dt className="text-xs text-mute">{s.label}</dt>
                <dd className="mt-1 font-mincho text-4xl font-semibold tabular-nums">{s.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>
    </section>
  );
}
