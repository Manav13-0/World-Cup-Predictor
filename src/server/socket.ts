import http from "node:http";
import { Server } from "socket.io";

const port = Number(process.env.PORT ?? process.env.SOCKET_PORT ?? 4000);
const server = http.createServer(async (request, response) => {
  if (request.method === "POST" && request.url === "/emit") {
    const chunks: Buffer[] = [];

    request.on("data", (chunk) => chunks.push(chunk));
    request.on("end", () => {
      try {
        const body = JSON.parse(Buffer.concat(chunks).toString("utf8")) as { event: string; payload: unknown };
        io.emit(body.event, body.payload);
        response.writeHead(202, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ ok: true }));
      } catch {
        response.writeHead(400, { "Content-Type": "application/json" });
        response.end(JSON.stringify({ error: "Invalid event payload" }));
      }
    });
    return;
  }

  response.writeHead(200, { "Content-Type": "application/json" });
  response.end(JSON.stringify({ ok: true }));
});

const io = new Server(server, {
  cors: {
    origin: process.env.NEXTAUTH_URL ?? "http://localhost:3000",
    credentials: true
  }
});

io.on("connection", (socket) => {
  socket.emit("connected", { id: socket.id });
});

server.listen(port, () => {
  console.log(`Socket server listening on ${port}`);
});
