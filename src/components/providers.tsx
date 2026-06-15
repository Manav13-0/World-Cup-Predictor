"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { getSocket } from "@/lib/socket-client";

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient());

  useEffect(() => {
    const socket = getSocket();
    socket.on("leaderboard_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["leaderboard"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
    });
    socket.on("match_updated", () => {
      queryClient.invalidateQueries({ queryKey: ["matches"] });
    });

    return () => {
      socket.disconnect();
    };
  }, [queryClient]);

  return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
}
