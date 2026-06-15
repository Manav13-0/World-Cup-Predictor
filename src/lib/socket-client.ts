import { io } from "socket.io-client";

export function getSocket() {
  const url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? process.env.SOCKET_SERVER_URL ?? "http://localhost:4000";
  return io(url, {
    transports: ["websocket"],
    autoConnect: true
  });
}
