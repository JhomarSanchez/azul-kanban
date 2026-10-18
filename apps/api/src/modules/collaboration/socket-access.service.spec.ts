import { ProjectAccessService } from "../projects";
import { SocketAccessService } from "./socket-access.service";
function fakeSocket(sessionId: string, userId: string, projectId?: string) {
  return {
    data: { sessionId, userId },
    rooms: new Set(["own-id", ...(projectId ? [`project:${projectId}`] : [])]),
    disconnect: jest.fn(),
    leave: jest.fn(async () => {}),
    emit: jest.fn(),
  };
}
describe("socket access sweep", () => {
  it("checks every connected socket with one session and one membership query", async () => {
    const sockets = [
      fakeSocket("s1", "u1", "p1"),
      fakeSocket("s2", "u2", "p1"),
      fakeSocket("s3", "u3", "p2"),
      fakeSocket("expired", "u4", "p1"),
    ];
    const db = {
      session: {
        findMany: jest.fn(async () => [{ id: "s1" }, { id: "s2" }, { id: "s3" }]),
      },
      membership: {
        findMany: jest.fn(async () => [
          { userId: "u1", projectId: "p1" },
          { userId: "u3", projectId: "p2" },
        ]),
      },
    };
    const service = new SocketAccessService(
      db as any,
      new ProjectAccessService(db as any),
    );
    await service.sweep({
      sockets: { sockets: new Map(sockets.map((s, i) => [String(i), s])) },
    } as any);
    expect(db.session.findMany).toHaveBeenCalledTimes(1);
    expect(db.membership.findMany).toHaveBeenCalledTimes(1);
    expect(sockets[3].disconnect).toHaveBeenCalledWith(true);
    expect(sockets[1].leave).toHaveBeenCalledWith("project:p1");
    expect(sockets[1].emit).toHaveBeenCalledWith("project:revoked");
    for (const socket of [sockets[0], sockets[2]]) {
      expect(socket.leave).not.toHaveBeenCalled();
      expect(socket.disconnect).not.toHaveBeenCalled();
    }
  });
  it("does not query the database without connected sockets", async () => {
    const db = { session: { findMany: jest.fn() } };
    await new SocketAccessService(db as any, {} as any).sweep({
      sockets: { sockets: new Map() },
    } as any);
    expect(db.session.findMany).not.toHaveBeenCalled();
  });
});
