import Link from "next/link";

import { Button } from "@/components/ui/button";

type AuthSetupCardProps = {
  title: string;
  description: string;
};

export function AuthSetupCard({ title, description }: AuthSetupCardProps) {
  return (
    <section className="rounded-[1.8rem] border border-dashed border-primary/30 bg-surface p-7 shadow-[0_18px_70px_-58px_rgba(17,24,39,0.45)]">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-primary">Auth setup required</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-8 text-muted">{description}</p>
      <div className="mt-6 flex flex-col gap-3 sm:flex-row">
        <Button asChild>
          <Link href="/sign-in" prefetch={false}>
            Open sign in route
          </Link>
        </Button>
        <Button asChild variant="secondary">
          <Link href="/contact">Open contact page</Link>
        </Button>
      </div>
    </section>
  );
}
