import { env } from "@/lib/env";

type SocketEvent =
  | "match_updated"
  | "leaderboard_updated"
  | "prediction_created"
  | "points_awarded"
  | "rank_changed";

export async function emitSocketEvent(event: SocketEvent, payload: unknown) {
  if (!env.SOCKET_SERVER_URL) return;

  await fetch(`${env.SOCKET_SERVER_URL}/emit`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ event, payload })
  }).catch(() => undefined);
}
