import { Skeleton } from "@/components/ui/skeleton";

export default function Loading() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-10">
      <Skeleton className="h-6 w-40" />
      <Skeleton className="mt-4 h-10 w-72" />
      <div className="mt-8 grid gap-4 md:grid-cols-3">
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
        <Skeleton className="h-52 rounded-3xl" />
      </div>
      <div className="mt-8 grid gap-4 lg:grid-cols-[1.2fr_0.8fr]">
        <Skeleton className="h-80 rounded-3xl" />
        <Skeleton className="h-80 rounded-3xl" />
      </div>
    </div>
  );
}
