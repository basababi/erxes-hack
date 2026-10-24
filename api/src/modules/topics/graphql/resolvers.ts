import { GraphQLError } from "graphql";
import { z } from "zod";
import type { Context } from "../../../connectionResolvers.ts";
import { TOPICS_MANAGE, TOPICS_SHOW } from "../../../permissions.ts";
import { TOPIC_KINDS } from "../constants.ts";
import type { ITopic, ITopicDocument } from "../db/definitions/topic.ts";

const badInput = (message: string) =>
  new GraphQLError(message, { extensions: { code: "BAD_USER_INPUT" } });

const pageSchema = z.object({
  limit: z.number().int().min(1).max(100),
  offset: z.number().int().min(0).max(10_000),
});

const topicInputSchema = z.object({
  name: z.string().trim().min(1, "Name is required").max(120),
  description: z
    .string()
    .trim()
    .max(1000)
    .nullish()
    .transform((value) => value || undefined),
  gradeLevel: z
    .number()
    .int()
    .min(1)
    .max(12)
    .nullish()
    .transform((value) => value ?? undefined),
  kind: z.enum(TOPIC_KINDS),
});

const parse = <T>(schema: z.ZodType<T>, value: unknown): T => {
  const result = schema.safeParse(value);

  if (!result.success) {
    throw badInput(result.error.issues.map((issue) => issue.message).join("; "));
  }

  return result.data;
};

// The gateway only asserts a logged-in user; every resolver checks its own
// action and needs a tenant before touching tenant-bound models.
const authorize = async ({ user, subdomain, checkPermission }: Context, action: string) => {
  if (!user?._id) {
    throw new GraphQLError("Login required", { extensions: { code: "UNAUTHENTICATED" } });
  }
  if (!subdomain) {
    throw new GraphQLError("Tenant required", { extensions: { code: "FORBIDDEN" } });
  }
  await checkPermission(action);
};

const toGraphql = (topic: ITopicDocument) => ({
  ...topic,
  createdAt: topic.createdAt?.toISOString?.() ?? null,
});

export const topicResolvers = {
  Query: {
    edututorTopics: async (
      _parent: unknown,
      args: { limit?: number; offset?: number },
      context: Context,
    ) => {
      await authorize(context, TOPICS_SHOW);
      const page = parse(pageSchema, { limit: args.limit ?? 50, offset: args.offset ?? 0 });

      return (await context.models.Topics.list(page)).map(toGraphql);
    },
    edututorTopicDetail: async (_parent: unknown, { _id }: { _id: string }, context: Context) => {
      await authorize(context, TOPICS_SHOW);

      return toGraphql(await context.models.Topics.getTopic(_id));
    },
  },
  Mutation: {
    edututorTopicAdd: async (_parent: unknown, { input }: { input: ITopic }, context: Context) => {
      await authorize(context, TOPICS_MANAGE);

      return toGraphql(await context.models.Topics.createTopic(parse(topicInputSchema, input)));
    },
    edututorTopicEdit: async (
      _parent: unknown,
      { _id, input }: { _id: string; input: ITopic },
      context: Context,
    ) => {
      await authorize(context, TOPICS_MANAGE);

      return toGraphql(
        await context.models.Topics.updateTopic(_id, parse(topicInputSchema, input)),
      );
    },
    edututorTopicRemove: async (_parent: unknown, { _id }: { _id: string }, context: Context) => {
      await authorize(context, TOPICS_MANAGE);

      return context.models.Topics.removeTopic(_id);
    },
  },
};
