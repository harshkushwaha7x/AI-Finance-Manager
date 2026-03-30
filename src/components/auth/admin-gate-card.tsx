type AdminGateCardProps = {
  email: string | null;
};

export function AdminGateCard({ email }: AdminGateCardProps) {
  return (
    <section className="rounded-[1.8rem] border border-warning/25 bg-surface p-7 shadow-[0_18px_70px_-58px_rgba(17,24,39,0.45)]">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-warning">Admin access only</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">
        This workspace is reserved for demo admin users.
      </h2>
      <p className="mt-4 max-w-3xl text-sm leading-8 text-muted">
        You are signed in{email ? ` as ${email}` : ""}, but this route currently expects either
        Clerk public metadata role `admin` or a matching email in `DEMO_ADMIN_EMAILS`.
      </p>
    </section>
  );
}
