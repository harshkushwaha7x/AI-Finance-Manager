import { ContactForm } from "@/components/marketing/contact-form";
import { PageHero } from "@/components/marketing/page-hero";
import { SiteContainer } from "@/components/shared/site-container";
import { siteConfig } from "@/lib/constants/site";

const supportTracks = [
  "Product walkthroughs and portfolio demos",
  "Accountant consultation and finance setup requests",
  "Feedback for feature roadmap and workflow priorities",
];

export default function ContactPage() {
  return (
    <>
      <PageHero
        eyebrow="Contact"
        title="Give the marketing site a real conversion endpoint from the beginning."
        description="This form already validates and posts into a route handler, making it a strong base for later lead persistence and admin review flows."
      />
      <section className="py-20">
        <SiteContainer className="grid gap-8 lg:grid-cols-[0.85fr_1.15fr]">
          <div className="rounded-[1.8rem] border border-black/6 bg-surface p-7">
            <p className="font-display text-2xl font-bold text-foreground">Support tracks</p>
            <div className="mt-6 space-y-4">
              {supportTracks.map((track) => (
                <div key={track} className="rounded-2xl border border-black/6 bg-surface-subtle p-4 text-sm leading-7 text-muted">
                  {track}
                </div>
              ))}
            </div>
            <div className="mt-8 rounded-3xl bg-foreground p-5 text-white">
              <p className="font-mono text-xs uppercase tracking-[0.3em] text-white/55">Email</p>
              <p className="mt-3 text-base">{siteConfig.contactEmail}</p>
            </div>
          </div>
          <ContactForm />
        </SiteContainer>
      </section>
    </>
  );
}
