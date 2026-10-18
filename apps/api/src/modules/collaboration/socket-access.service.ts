import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { Database } from "../../infrastructure/database";
import { ProjectAccessService } from "../projects";
@Injectable()
export class SocketAccessService {
  constructor(
    private db: Database,
    private projects: ProjectAccessService,
  ) {}
  /** Two queries per sweep, whatever the number of connected sockets. */
  async sweep(server: Server) {
    const sockets = [...server.sockets.sockets.values()];
    if (!sockets.length) return;
    const sessions = await this.db.session.findMany({
      where: {
        id: {
          in: [
            ...new Set(
              sockets.map((socket) => socket.data.sessionId).filter(Boolean),
            ),
          ],
        },
        expiresAt: { gt: new Date() },
      },
      select: { id: true },
    });
    const valid = new Set(sessions.map((session) => session.id));
    const subscribed: { socket: (typeof sockets)[number]; room: string }[] =
      [];
    for (const socket of sockets) {
      if (!valid.has(socket.data.sessionId)) {
        socket.disconnect(true);
        continue;
      }
      for (const room of socket.rooms)
        if (room.startsWith("project:")) subscribed.push({ socket, room });
    }
    const readable = await this.projects.readable(
      subscribed.map(({ socket, room }) => ({
        userId: socket.data.userId,
        projectId: room.slice(8),
      })),
    );
    for (const { socket, room } of subscribed)
      if (!readable.has(`${socket.data.userId}:${room.slice(8)}`)) {
        await socket.leave(room);
        socket.emit("project:revoked");
      }
  }
}
