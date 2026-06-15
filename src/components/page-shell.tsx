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
      <div className="mb-7 max-w-3xl">
        <h1 className="text-3xl font-semibold tracking-normal sm:text-4xl">{title}</h1>
        {description ? <p className="mt-2 text-muted-foreground">{description}</p> : null}
      </div>
      {children}
    </section>
  );
}
