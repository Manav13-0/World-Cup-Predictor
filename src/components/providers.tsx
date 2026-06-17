"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";
import { PointsCelebration } from "@/components/points-celebration";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const socket = getSocket();
    const handleLeaderboardUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    };
    const handleMatchUpdated = () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    };

    socket.on("leaderboard_updated", handleLeaderboardUpdated);
    socket.on("match_updated", handleMatchUpdated);

    return () => {
      socket.off("leaderboard_updated", handleLeaderboardUpdated);
      socket.off("match_updated", handleMatchUpdated);
      socket.disconnect();
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <PointsCelebration />
    </QueryClientProvider>
  );
}
