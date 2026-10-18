import { Injectable } from "@nestjs/common";
import { Response } from "express";
import { createHash, randomBytes, timingSafeEqual } from "node:crypto";
import { Database } from "../../infrastructure/database";
import { settings } from "../../infrastructure/settings";
export const digest = (token: string) =>
  createHash("sha256").update(token).digest("hex");
/** Constant-time CSRF comparison shared by the guard and unauthenticated entry points. */
export function csrfMatches(supplied: string | undefined, expected: string) {
  const a = Buffer.from(supplied ?? "");
  const b = Buffer.from(expected);
  return a.length === b.length && timingSafeEqual(a, b);
}
export const publicUser = (user: {
  id: string;
  name: string;
  email: string | null;
  guest: boolean;
}) => ({ id: user.id, name: user.name, email: user.email, guest: user.guest });
@Injectable()
export class IdentityService {
  constructor(private db: Database) {}
  async resolve(token?: string) {
    if (typeof token !== "string" || !/^[A-Za-z0-9_-]{43}$/.test(token))
      return null;
    const session = await this.db.session.findUnique({
      where: { id: digest(token) },
      include: { user: true },
    });
    return session && session.expiresAt.getTime() > Date.now() ? session : null;
  }
  async issue(userId: string, response: Response, hours = 168) {
    const token = randomBytes(32).toString("base64url");
    const csrf = randomBytes(24).toString("base64url");
    await this.db.session.create({
      data: {
        id: digest(token),
        csrf,
        userId,
        expiresAt: new Date(Date.now() + hours * 3600000),
      },
    });
    response.cookie("azul_session", token, {
      httpOnly: true,
      secure: settings.production,
      sameSite: "lax",
      maxAge: hours * 3600000,
      path: "/",
    });
    return csrf;
  }
}
