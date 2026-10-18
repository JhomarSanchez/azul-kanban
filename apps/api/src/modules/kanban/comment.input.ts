import { Version } from "@azul/contracts";
import { z } from "zod";
export const CommentInput = Version.extend({
  text: z.string().trim().min(1).max(2000),
});
