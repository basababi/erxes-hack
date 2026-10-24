import { z } from "zod";
import type { Context } from "../../../connectionResolvers.ts";
import { authorize, badInput, isoDate, pageSchema, parse } from "../../../graphql/guards.ts";
import { PROBLEMS_APPROVE, PROBLEMS_GENERATE, TOPICS_SHOW } from "../../../permissions.ts";
import { TOPIC_KINDS } from "../../topics/constants.ts";
import { DIFFICULTIES, MAX_GENERATE_COUNT, PROBLEM_STATUSES, type ProblemStatus } from "../constants.ts";
import type { IProblemDocument } from "../db/definitions/problem.ts";
import { MISCONCEPTIONS, type Difficulty, type ProblemKind } from "../engineAdapter.ts";
import { generateProblems } from "../services/generateProblems.ts";

const listSchema = pageSchema.extend({
  topicId: z.string().min(1),
  status: z.enum(PROBLEM_STATUSES).nullish().transform((value) => value ?? undefined),
});

const generateSchema = z.object({
  topicId: z.string().min(1),
  count: z.number().int().min(1).max(MAX_GENERATE_COUNT, `Нэг удаад ${MAX_GENERATE_COUNT} хүртэл`),
  difficulty: z.enum(DIFFICULTIES),
  useAi: z.boolean(),
});

const toGraphql = (problem: IProblemDocument) => ({
  ...problem,
  createdAt: isoDate(problem.createdAt),
});

export const problemResolvers = {
  Query: {
    edututorProblems: async (
      _parent: unknown,
      args: { topicId: string; status?: ProblemStatus | null; limit?: number; offset?: number },
      context: Context,
    ) => {
      await authorize(context, TOPICS_SHOW);
      const query = parse(listSchema, { ...args, limit: args.limit ?? 50, offset: args.offset ?? 0 });

      return (await context.models.Problems.listByTopic(query)).map(toGraphql);
    },
    edututorMisconceptions: async (
      _parent: unknown,
      { kind }: { kind: ProblemKind },
      context: Context,
    ) => {
      await authorize(context, TOPICS_SHOW);
      const topicKind = parse(z.enum(TOPIC_KINDS), kind);

      return MISCONCEPTIONS.filter((misconception) => misconception.kind === topicKind);
    },
  },
  Mutation: {
    edututorProblemsGenerate: async (
      _parent: unknown,
      args: { topicId: string; count?: number; difficulty?: Difficulty; useAi?: boolean },
      context: Context,
    ) => {
      await authorize(context, PROBLEMS_GENERATE);
      const input = parse(generateSchema, {
        topicId: args.topicId,
        count: args.count ?? 3,
        difficulty: args.difficulty ?? "medium",
        useAi: args.useAi ?? true,
      });
      const topic = await context.models.Topics.getTopic(input.topicId);
      // AI failures fall back inside; what reaches here is the engine
      // refusing a kind it cannot build yet.
      const generated = await generateProblems({ ...input, kind: topic.kind }).catch(() => {
        throw badInput("Энэ төрлийн бодлогыг одоогоор үүсгэх боломжгүй");
      });
      const problems = await context.models.Problems.createProblems(generated.problems);

      return { ...generated, problems: problems.map(toGraphql) };
    },
    edututorProblemApprove: async (_parent: unknown, { _id }: { _id: string }, context: Context) => {
      await authorize(context, PROBLEMS_APPROVE);

      return toGraphql(await context.models.Problems.approveProblem(_id));
    },
    edututorProblemReject: async (_parent: unknown, { _id }: { _id: string }, context: Context) => {
      await authorize(context, PROBLEMS_APPROVE);

      return toGraphql(await context.models.Problems.rejectProblem(_id));
    },
  },
};
