import Link from "next/link";

import { SiteContainer } from "@/components/shared/site-container";
import { Button } from "@/components/ui/button";

export function CtaBanner() {
  return (
    <section className="py-20">
      <SiteContainer>
        <div className="rounded-[2rem] bg-foreground px-6 py-10 text-white shadow-[0_30px_90px_-55px_rgba(17,24,39,0.8)] sm:px-10 lg:px-12">
          <div className="max-w-3xl">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Build credibility fast</p>
            <h2 className="mt-4 font-display text-3xl font-bold tracking-tight sm:text-4xl">
              Start with a polished marketing and dashboard foundation, then layer in the finance engine.
            </h2>
            <p className="mt-4 max-w-2xl text-base leading-8 text-white/76 sm:text-lg">
              This repo is structured to support daily commits, visible GitHub momentum, and a believable
              fintech SaaS story by the end of the month.
            </p>
          </div>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">Open product workspace</Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="border-white/15 bg-white/8 text-white hover:bg-white/12">
              <Link href="/contact">Request accountant services</Link>
            </Button>
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}
