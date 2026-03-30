"use client";

type ShellLoadingProps = {
  label: string;
};

export function ShellLoading({ label }: ShellLoadingProps) {
  return (
    <div className="space-y-6">
      <div className="h-5 w-40 animate-pulse rounded-full bg-foreground/8" />
      <div className="grid gap-6 xl:grid-cols-3">
        {Array.from({ length: 3 }).map((_, index) => (
          <div
            key={index}
            className="h-40 animate-pulse rounded-[1.8rem] border border-black/6 bg-surface"
          />
        ))}
      </div>
      <div className="rounded-[1.8rem] border border-black/6 bg-surface p-8">
        <p className="text-sm text-muted">{label}</p>
      </div>
    </div>
  );
}

type ShellErrorStateProps = {
  title: string;
  description: string;
  onRetry?: () => void;
};

export function ShellErrorState({
  title,
  description,
  onRetry,
}: ShellErrorStateProps) {
  return (
    <section className="rounded-[1.8rem] border border-danger/25 bg-surface p-7 shadow-[0_18px_70px_-58px_rgba(17,24,39,0.45)]">
      <p className="font-mono text-xs uppercase tracking-[0.28em] text-danger">Something went wrong</p>
      <h2 className="mt-3 font-display text-3xl font-bold tracking-tight text-foreground">{title}</h2>
      <p className="mt-4 max-w-3xl text-sm leading-8 text-muted">{description}</p>
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="mt-6 inline-flex h-11 items-center justify-center rounded-2xl bg-foreground px-5 text-sm font-semibold text-white transition hover:bg-black/90"
        >
          Retry
        </button>
      ) : null}
    </section>
  );
}
