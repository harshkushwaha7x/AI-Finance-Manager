type MetricCardProps = {
  label: string;
  value: string;
  detail: string;
};

export function MetricCard({ label, value, detail }: MetricCardProps) {
  return (
    <article className="rounded-[1.6rem] border border-black/6 bg-surface p-6 shadow-[0_18px_70px_-55px_rgba(17,24,39,0.48)]">
      <p className="text-sm font-medium text-muted">{label}</p>
      <p className="mt-4 font-display text-3xl font-bold tracking-tight text-foreground">{value}</p>
      <p className="mt-3 text-sm leading-7 text-muted">{detail}</p>
    </article>
  );
}
