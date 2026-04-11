import type { Metadata } from "next";

import { PageHero } from "@/components/marketing/page-hero";
import { SiteContainer } from "@/components/shared/site-container";
import { buildMetadata } from "@/lib/metadata";

export const metadata: Metadata = buildMetadata({
  title: "Privacy",
  description:
    "Read how AI Finance Manager handles account data, uploaded documents, and AI-assisted workflows in the portfolio MVP.",
  path: "/privacy",
});

export default function PrivacyPage() {
  return (
    <>
      <PageHero
        eyebrow="Privacy"
        title="Privacy for the AI Finance Manager portfolio MVP"
        description="This privacy page explains the current data-handling stance for authentication, finance records, uploads, and AI-assisted workflows."
      />
      <section className="py-20">
        <SiteContainer className="max-w-4xl rounded-[2rem] border border-black/6 bg-surface p-8 text-base leading-8 text-muted">
          <p>
            AI Finance Manager is designed to collect only the data required to provide finance
            tracking, document workflows, AI assistance, and accountant-service coordination. In
            the current MVP, uploaded files, transaction records, and generated AI summaries are
            used only to power the product experience shown in the app. As the platform evolves,
            this page will continue to document storage providers, retention expectations, and user
            controls for deleting or exporting data.
          </p>
        </SiteContainer>
      </section>
    </>
  );
}
