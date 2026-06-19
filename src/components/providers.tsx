"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { getSocket } from "@/lib/socket-client";
import { PointsCelebration } from "@/components/points-celebration";

function LiveSocketBridge({ queryClient }: { queryClient: QueryClient }) {
  const router = useRouter();
  const refreshTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const socket = getSocket();

    const invalidateApp = () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["matches"] });
      queryClient.invalidateQueries({ queryKey: ["admin"] });

      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }

      refreshTimer.current = setTimeout(() => {
        router.refresh();
      }, 250);
    };

    const eventNames = ["match_updated", "match_event", "leaderboard_updated", "prediction_created", "points_awarded", "rank_changed"] as const;

    eventNames.forEach((eventName) => socket.on(eventName, invalidateApp));

    return () => {
      eventNames.forEach((eventName) => socket.off(eventName, invalidateApp));
      if (refreshTimer.current) {
        clearTimeout(refreshTimer.current);
      }
    };
  }, [queryClient, router]);

  return null;
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  return (
    <QueryClientProvider client={queryClient}>
      <LiveSocketBridge queryClient={queryClient} />
      {children}
      <PointsCelebration />
    </QueryClientProvider>
  );
}
