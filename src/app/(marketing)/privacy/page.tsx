import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SiteContainer } from "@/components/shared/site-container";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy",
  description:
    "Read the privacy policy placeholder for the AI Finance Manager MVP and future data-handling direction.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy policy placeholder for the portfolio MVP"
        description="This page is intentionally lightweight for the initial foundation and will be expanded as authentication, uploads, and AI workflows go live."
      />
      <section className="py-20">
        <SiteContainer className="max-w-4xl rounded-[2rem] border border-black/6 bg-surface p-8 text-base leading-8 text-muted">
          <p>
            We plan to collect only the minimum data necessary to provide finance management features,
            AI assistance, document workflows, and accountant service coordination. As the platform grows,
            this page should document data retention, storage providers, AI-processing disclosures, and user controls.
          </p>
        </SiteContainer>
      </section>
    </>
  );
}
