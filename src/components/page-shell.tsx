import { cn } from "@/lib/utils";

export function PageShell({
  title,
  description,
  children,
  className
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section className={cn("mx-auto w-full max-w-7xl overflow-hidden px-3 py-6 sm:px-4 sm:py-10", className)}>
      <div className="mb-6 max-w-4xl sm:mb-7">
        <div className="mb-3 inline-flex max-w-full items-center gap-2 rounded-full border border-white/10 bg-white/[0.10] px-3 py-1 text-[9px] font-semibold uppercase tracking-[0.28em] text-muted-foreground backdrop-blur-xl sm:mb-4 sm:text-[10px] sm:tracking-[0.35em]">
          <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_0_6px_rgba(139,92,246,0.18)]" />
          FIFA World Cup Intelligence
        </div>
        <h1 className="text-2xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-6 text-muted-foreground sm:text-base sm:leading-7">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
