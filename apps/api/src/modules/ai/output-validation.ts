import { z } from "zod";
import { fail } from "../../infrastructure/http";
export function validateAiOutput(schema: z.ZodType, value: unknown) {
  const result = schema.safeParse(value);
  if (!result.success)
    fail(
      502,
      "La IA devolvió datos que no pudimos validar.",
      "AI_INVALID_OUTPUT",
    );
  return result.data;
}
