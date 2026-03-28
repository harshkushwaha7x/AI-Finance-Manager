import { SiteContainer } from "@/components/shared/site-container";

const trustCopy = ["Premium dashboard UX", "Document-ready workflows", "AI-assisted finance ops", "Accountant intake pipeline"];

export function TrustBar() {
  return (
    <section className="border-y border-black/5 bg-white/70">
      <SiteContainer className="grid gap-5 py-6 text-center sm:grid-cols-2 lg:grid-cols-4">
        {trustCopy.map((item) => (
          <p key={item} className="text-sm font-semibold tracking-[0.16em] text-muted uppercase">
            {item}
          </p>
        ))}
      </SiteContainer>
    </section>
  );
}
