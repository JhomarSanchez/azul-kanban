import { Injectable } from "@nestjs/common";
import { Server } from "socket.io";
import { OutboxRepository } from "../activity";
import { SocketAccessService } from "./socket-access.service";
@Injectable()
export class OutboxPublisher {
  private running = false;
  constructor(
    private outbox: OutboxRepository,
    private access: SocketAccessService,
  ) {}
  async publish(server: Server) {
    if (this.running || !server) return;
    this.running = true;
    try {
      await this.access.sweep(server);
      for (const event of await this.outbox.pending()) {
        server.to(`project:${event.projectId}`).emit("board:changed", {
          eventId: event.id,
          projectId: event.projectId,
          version: event.version,
          type: event.type,
        });
        await this.outbox.published(event.id);
      }
    } catch (error) {
      console.error(
        JSON.stringify({
          component: "outbox",
          error: error instanceof Error ? error.name : "UnknownError",
        }),
      );
    } finally {
      this.running = false;
    }
  }
}
