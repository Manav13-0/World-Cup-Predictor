import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";
import { MatchStatus, Prisma } from "@prisma/client";
import { MatchCard } from "@/components/match-card";
import { PageShell } from "@/components/page-shell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { prisma } from "@/lib/prisma";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 12;
const STATUS_TABS = [
  { label: "All", value: "ALL" },
  { label: "Scheduled", value: "SCHEDULED" },
  { label: "Live", value: "LIVE" },
  { label: "Finished", value: "FINISHED" }
] as const;

const STAGES = [
  { label: "All stages", value: "" },
  { label: "Group Stage", value: "GROUP_STAGE" },
  { label: "Round of 32", value: "LAST_32" },
  { label: "Round of 16", value: "LAST_16" },
  { label: "Quarter Finals", value: "QUARTER_FINALS" },
  { label: "Semi Finals", value: "SEMI_FINALS" },
  { label: "Third Place", value: "THIRD_PLACE" },
  { label: "Final", value: "FINAL" }
];

function buildHref(params: { q?: string; status?: string; stage?: string; page?: number }) {
  const searchParams = new URLSearchParams();
  if (params.q) searchParams.set("q", params.q);
  if (params.status) searchParams.set("status", params.status);
  if (params.stage) searchParams.set("stage", params.stage);
  if (params.page && params.page > 1) searchParams.set("page", String(params.page));
  const query = searchParams.toString();
  return query ? `/matches?${query}` : "/matches";
}

export default async function MatchesPage({
  searchParams
}: {
  searchParams: Promise<{ q?: string; status?: string; stage?: string; page?: string }>;
}) {
  const params = await searchParams;
  const query = params.q?.trim() ?? "";
  const activeStatus = params.status?.trim() || "FINISHED";
  const activeStage = params.stage?.trim() ?? "";
  const currentPage = Math.max(Number(params.page ?? 1) || 1, 1);

  const where: Prisma.MatchWhereInput = {
    status: activeStatus === "ALL" ? undefined : (activeStatus as MatchStatus),
    round: activeStage || undefined,
    ...(query
      ? {
          OR: [
            { homeTeam: { is: { name: { contains: query, mode: "insensitive" } } } },
            { awayTeam: { is: { name: { contains: query, mode: "insensitive" } } } }
          ]
        }
      : {})
  };

  const totalMatches = await prisma.match.count({ where });

  const totalPages = Math.max(1, Math.ceil(totalMatches / PAGE_SIZE));
  const safePage = Math.min(currentPage, totalPages);

  const pagedMatches = await prisma.match.findMany({
    where,
    include: { homeTeam: true, awayTeam: true },
    orderBy: { kickoff: "asc" },
    skip: (safePage - 1) * PAGE_SIZE,
    take: PAGE_SIZE
  });

  return (
    <PageShell title="Matches" description="Search fixtures, filter by status, and submit predictions before kickoff.">
      <Card className="mb-6 overflow-hidden">
        <CardContent className="space-y-5 p-5 sm:p-6">
          <div className="flex flex-wrap gap-2">
            {STATUS_TABS.map((tab) => {
              const active = activeStatus === tab.value || (!params.status && tab.value === "FINISHED");
              return (
                <Button
                  key={tab.value}
                  asChild
                  variant={active ? "default" : "outline"}
                  size="sm"
                  className={cn("rounded-full px-4", active ? "" : "text-muted-foreground")}
                >
                  <Link href={buildHref({ q: query, status: tab.value, stage: activeStage, page: 1 })}>{tab.label}</Link>
                </Button>
              );
            })}
          </div>

          <form method="get" className="grid gap-4 md:grid-cols-[minmax(0,1fr)_220px_auto] md:items-end">
            <input type="hidden" name="status" value={activeStatus} />
            <label className="block">
              <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">
                Search Teams
              </span>
              <div className="relative">
                <Search className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" size={16} />
                <Input name="q" defaultValue={query} placeholder="Search teams" className="pl-10" />
              </div>
            </label>

            <input type="hidden" name="stage" value={activeStage} />
            <Button type="submit" className="h-11 px-5 md:self-end">
              Apply Filters
            </Button>
          </form>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-[0.28em] text-muted-foreground">Stage</p>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {STAGES.map((stage) => {
                const active = activeStage === stage.value;
                return (
                  <Button
                    key={stage.value || "all"}
                    asChild
                    variant={active ? "default" : "outline"}
                    size="sm"
                    className={cn(
                      "shrink-0 rounded-full px-4",
                      active ? "" : "text-muted-foreground"
                    )}
                  >
                    <Link href={buildHref({ q: query, status: activeStatus, stage: stage.value, page: 1 })}>
                      {stage.label}
                    </Link>
                  </Button>
                );
              })}
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {pagedMatches.map((match) => (
          <MatchCard key={match.id} match={match} />
        ))}
      </div>

      <div className="mt-8 flex flex-col gap-4 rounded-3xl border border-white/10 bg-card/80 p-4 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-muted-foreground">
          Showing page <span className="font-medium text-foreground">{safePage}</span> of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </p>
        <div className="flex items-center gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={safePage <= 1}
            className={cn(safePage <= 1 && "pointer-events-none opacity-50")}
          >
            <Link href={buildHref({ q: query, status: activeStatus, stage: activeStage, page: safePage - 1 })}>
              <ChevronLeft size={16} />
              Prev
            </Link>
          </Button>
          <Button
            asChild
            variant="outline"
            size="sm"
            disabled={safePage >= totalPages}
            className={cn(safePage >= totalPages && "pointer-events-none opacity-50")}
          >
            <Link href={buildHref({ q: query, status: activeStatus, stage: activeStage, page: safePage + 1 })}>
              Next
              <ChevronRight size={16} />
            </Link>
          </Button>
        </div>
      </div>
    </PageShell>
  );
}
