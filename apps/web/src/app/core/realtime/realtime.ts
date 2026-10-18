import { Injectable, signal } from "@angular/core";
import { io, Socket } from "socket.io-client";
@Injectable({ providedIn: "root" })
export class Realtime {
  readonly connection = signal<"connecting" | "connected" | "offline">(
    "connecting",
  );
  private socket?: Socket;
  connect(
    projectId: string,
    callbacks: {
      changed: (version: number) => void;
      revoked: () => void;
      connected: () => void;
    },
  ) {
    this.disconnect();
    this.connection.set("connecting");
    const socket = (this.socket = io({ withCredentials: true }));
    socket.on("connect", () => {
      if (this.socket !== socket) return;
      socket.emit("project:subscribe", projectId, (ack: { ok: boolean }) => {
        if (this.socket !== socket) return;
        if (!ack.ok) {
          callbacks.revoked();
          return;
        }
        this.connection.set("connected");
        callbacks.connected();
      });
    });
    socket.on("disconnect", () => {
      if (this.socket === socket) this.connection.set("offline");
    });
    socket.on("connect_error", () => {
      if (this.socket === socket) this.connection.set("offline");
    });
    socket.on(
      "board:changed",
      (event: { projectId: string; version: number }) => {
        if (this.socket === socket && event.projectId === projectId)
          callbacks.changed(event.version);
      },
    );
    socket.on("project:revoked", () => {
      if (this.socket === socket) callbacks.revoked();
    });
  }
  disconnect() {
    this.socket?.disconnect();
    this.socket = undefined;
    this.connection.set("offline");
  }
}
