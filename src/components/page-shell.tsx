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
    <section className={cn("mx-auto w-full max-w-7xl px-4 py-8 sm:py-10", className)}>
      <div className="mb-7 max-w-4xl">
        <div className="mb-4 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.10] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.35em] text-muted-foreground backdrop-blur-xl">
          <span className="h-2 w-2 rounded-full bg-violet-400 shadow-[0_0_0_6px_rgba(139,92,246,0.18)]" />
          FIFA World Cup Intelligence
        </div>
        <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{title}</h1>
        {description ? <p className="mt-3 max-w-3xl text-sm leading-7 text-muted-foreground sm:text-base">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
