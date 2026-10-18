import { z } from "zod";
export const InvitationRoleInput = z.object({
  role: z.enum(["MEMBER", "VIEWER"]),
});
export const JoinInvitationInput = z.object({
  name: z.string().trim().min(2).max(80).optional(),
});
