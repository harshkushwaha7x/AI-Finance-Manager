import Link from "next/link";
import { ArrowRight, Bot, BriefcaseBusiness, ChartColumnIncreasing, ShieldCheck } from "lucide-react";

import { SiteContainer } from "@/components/shared/site-container";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { heroMetrics, trustSignals } from "@/lib/constants/site";

const capabilityIcons = [ChartColumnIncreasing, Bot, BriefcaseBusiness, ShieldCheck];

export function HeroSection() {
  return (
    <section className="relative overflow-hidden">
      <div className="absolute inset-0 hero-grid opacity-70" />
      <div className="absolute inset-x-0 top-0 h-64 bg-[radial-gradient(circle_at_top,rgba(21,94,239,0.16),transparent_58%)]" />
      <SiteContainer className="relative grid gap-12 py-18 lg:grid-cols-[1.15fr_0.85fr] lg:py-24">
        <div className="max-w-3xl">
          <Badge>India-first fintech SaaS MVP</Badge>
          <h1 className="mt-6 text-balance font-display text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Run your money like a product team, not a spreadsheet.
          </h1>
          <p className="mt-6 max-w-2xl text-balance text-lg leading-8 text-muted sm:text-xl">
            AI Finance Manager combines personal finance tracking, business accounting workflows,
            GST-ready invoicing, and accountant service operations in one polished workspace.
          </p>
          <div className="mt-8 flex flex-col gap-4 sm:flex-row">
            <Button asChild size="lg">
              <Link href="/dashboard">
                Launch dashboard demo
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/services">Explore accountant services</Link>
            </Button>
          </div>
          <div className="mt-10 flex flex-wrap gap-3">
            {trustSignals.map((item) => (
              <span
                key={item}
                className="rounded-full border border-black/8 bg-white/70 px-4 py-2 text-sm font-medium text-foreground shadow-sm"
              >
                {item}
              </span>
            ))}
          </div>
        </div>
        <div className="space-y-5">
          <div className="glass-panel rounded-[2rem] border border-white/60 p-6 shadow-[0_30px_80px_-50px_rgba(17,24,39,0.45)]">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold text-muted">Portfolio-grade workspace preview</p>
                <p className="mt-1 font-display text-2xl font-bold text-foreground">Control tower</p>
              </div>
              <div className="rounded-full bg-primary/10 px-3 py-1 font-mono text-xs text-primary">
                live demo
              </div>
            </div>
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              {heroMetrics.map((metric, index) => {
                const Icon = capabilityIcons[index];
                return (
                  <div
                    key={metric.label}
                    className="rounded-3xl border border-black/6 bg-white p-4 shadow-[0_18px_60px_-45px_rgba(17,24,39,0.5)]"
                  >
                    <Icon className="h-5 w-5 text-primary" />
                    <p className="mt-4 font-mono text-2xl font-semibold text-foreground">{metric.value}</p>
                    <p className="mt-2 text-sm font-semibold text-foreground">{metric.label}</p>
                    <p className="mt-2 text-sm leading-6 text-muted">{metric.detail}</p>
                  </div>
                );
              })}
            </div>
          </div>
          <div className="rounded-[2rem] border border-black/6 bg-foreground p-6 text-white shadow-[0_26px_70px_-45px_rgba(17,24,39,0.7)]">
            <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/60">Day-one launch angle</p>
            <p className="mt-4 text-lg leading-8 text-white/88">
              Market this as an AI finance operating system for individuals, freelancers, and
              small businesses who also want access to real accountant help when complexity hits.
            </p>
          </div>
        </div>
      </SiteContainer>
    </section>
  );
}
