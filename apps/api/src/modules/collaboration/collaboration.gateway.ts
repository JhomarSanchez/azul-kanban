import { Injectable, OnModuleDestroy, OnModuleInit } from "@nestjs/common";
import {
  ConnectedSocket,
  MessageBody,
  OnGatewayInit,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from "@nestjs/websockets";
import { parse as parseCookie } from "cookie";
import { Server, Socket } from "socket.io";
import { RateLimit } from "../../infrastructure/http";
import { settings } from "../../infrastructure/settings";
import { IdentityService } from "../identity";
import { ProjectAccessService } from "../projects";
import { OutboxPublisher } from "./outbox-publisher.service";
@Injectable()
@WebSocketGateway({ cors: { origin: settings.origin, credentials: true } })
export class Collaboration
  implements OnGatewayInit, OnModuleInit, OnModuleDestroy
{
  @WebSocketServer() server!: Server;
  private timer?: ReturnType<typeof setInterval>;

  constructor(
    private identity: IdentityService,
    private projects: ProjectAccessService,
    private publisher: OutboxPublisher,
    private rate: RateLimit,
  ) {}
  afterInit(server: Server) {
    // Authenticate before the handshake completes; an async connection callback races subscriptions.
    server.use(async (socket, next) => {
      try {
        const origin = socket.handshake.headers.origin;
        if (origin && origin !== settings.origin)
          return next(new Error("Origen no autorizado."));
        const session = await this.identity.resolve(
          parseCookie(socket.handshake.headers.cookie ?? "").azul_session,
        );
        if (!session) return next(new Error("Sesión caducada."));
        socket.data.userId = session.userId;
        socket.data.sessionId = session.id;
        next();
      } catch {
        next(new Error("No pudimos validar la sesión."));
      }
    });
  }
  @SubscribeMessage("project:subscribe")
  async subscribe(
    @ConnectedSocket() socket: Socket,
    @MessageBody() projectId: unknown,
  ) {
    try {
      if (
        typeof projectId !== "string" ||
        projectId.length > 80 ||
        !socket.data.userId
      )
        throw new Error("access");
      this.rate.check(`socket:${socket.data.userId}`, 120, 60000);
      await this.projects.access(projectId, socket.data.userId);
      for (const room of socket.rooms)
        if (room.startsWith("project:")) await socket.leave(room);
      await socket.join(`project:${projectId}`);
      return { ok: true };
    } catch {
      socket.emit("project:revoked");
      return { ok: false };
    }
  }
  onModuleInit() {
    this.timer = setInterval(() => void this.flush(), 750);
  }
  onModuleDestroy() {
    if (this.timer) clearInterval(this.timer);
  }
  async flush() {
    await this.publisher.publish(this.server);
  }
}
