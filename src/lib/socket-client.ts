import { io } from "socket.io-client";

let socketInstance: ReturnType<typeof io> | null = null;

export function getSocket() {
  if (socketInstance) return socketInstance;

  const url = process.env.NEXT_PUBLIC_SOCKET_SERVER_URL ?? process.env.SOCKET_SERVER_URL ?? "http://localhost:4000";
  socketInstance = io(url, {
    transports: ["websocket"],
    autoConnect: true,
    reconnection: true,
    reconnectionDelay: 1000,
    reconnectionDelayMax: 5000
  });

  return socketInstance;
}
