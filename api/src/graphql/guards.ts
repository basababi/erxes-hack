import { GraphQLError } from "graphql";
import { z } from "zod";
import type { Context } from "../connectionResolvers.ts";

export const badInput = (message: string) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

export const pageSchema = z.object({
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0).max(10_000),
});

export const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw badInput(result.error.issues.map((issue) => issue.message).join("; "));
  }

  return result.data;
};

// The gateway only asserts a logged-in user; every resolver checks its own
// action and needs a tenant before touching tenant-bound models.
export const authorize = async ({ user, subdomain, checkPermission }: Context, action: string) => {
  if (!user?._id) {
    throw new GraphQLError("Login required", { extensions: { code: "UNAUTHENTICATED" } });
  }
  if (!subdomain) {
    throw new GraphQLError("Tenant required", { extensions: { code: "FORBIDDEN" } });
  }
  await checkPermission(action);
};

export const isoDate = (date: Date | undefined) => date?.toISOString?.() ?? null;
