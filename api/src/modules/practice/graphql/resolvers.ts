import { GraphQLError } from "graphql";
import { z } from "zod";
import type { Context } from "../../../connectionResolvers.ts";
import { authorize, badInput, isoDate, parse } from "../../../graphql/guards.ts";
import { PRACTICE_MANAGE } from "../../../permissions.ts";
import type { IProblemDocument } from "../../problems/db/definitions/problem.ts";
import { diagnose, isCorrect, type Misconception } from "../../problems/engineAdapter.ts";
import { PRACTICE_PROBLEM_COUNT } from "../constants.ts";
import type { IAttempt, IAttemptDocument } from "../db/definitions/attempt.ts";
import {
  calculatePracticeSummary,
  newAttemptItems,
  selectPracticeProblemIds,
} from "../services/practice.ts";

const idSchema = z.string().trim().min(1).max(100);
const startSchema = z.object({ customerId: idSchema, topicId: idSchema });
const itemSchema = z.object({ attemptId: idSchema, problemId: idSchema });
const answerSchema = itemSchema.extend({ answer: z.string().trim().min(1).max(100) });
const customerSchema = z.object({ _id: z.string().min(1) });

type AttemptLike = Pick<
  IAttempt,
  "customerId" | "topicId" | "items" | "score" | "status" | "startedAt" | "finishedAt"
> & { _id: unknown };

const ensureCustomer = async (context: Context, customerId: string) => {
  const { sendTRPCMessage } = await import("erxes-api-shared/utils");
  const customer: unknown = await sendTRPCMessage({
    subdomain: context.subdomain,
    pluginName: "core",
    method: "query",
    module: "customers",
    action: "findOne",
    input: { query: { _id: customerId } },
    defaultValue: null,
  });

  if (!customerSchema.safeParse(customer).success) {
    throw badInput("Сонгосон сурагч энэ байгууллагын Contacts-д олдсонгүй");
  }
};

const studentProblem = (problem: IProblemDocument) => ({
  _id: String(problem._id),
  topicId: problem.topicId,
  difficulty: problem.difficulty,
  statement: problem.statement,
});

const sessionFor = async (context: Context, attempt: AttemptLike) => {
  const ids = attempt.items.map((item) => item.problemId);
  const problems = await context.models.Problems.findByIds(ids);
  const byId = new Map(problems.map((problem) => [String(problem._id), problem]));
  const items = attempt.items.map((item) => {
    const problem = byId.get(item.problemId);

    if (!problem) {
      throw new GraphQLError("Дадлагын бодлого устсан байна. Шинэ дадлага эхлүүлнэ үү", {
        extensions: { code: "BAD_USER_INPUT" },
      });
    }

    return {
      problem: studentProblem(problem),
      answered: item.answer !== undefined,
      correct: item.answer === undefined ? null : Boolean(item.correct),
      hintsUsed: item.hintsUsed,
      firstTry: item.firstTry ?? null,
      revealedHints: problem.hints.slice(0, item.hintsUsed),
    };
  });
  const summary = calculatePracticeSummary(attempt.items);

  return {
    attemptId: String(attempt._id),
    customerId: attempt.customerId,
    topicId: attempt.topicId,
    items,
    answeredCount: items.filter((item) => item.answered).length,
    correctCount: summary.correctCount,
    total: items.length,
    score: attempt.score,
    mastery: summary.mastery,
    status: attempt.status,
    startedAt: attempt.startedAt.toISOString(),
    finishedAt: isoDate(attempt.finishedAt),
  };
};

const attemptItem = (attempt: IAttemptDocument, problemId: string) => {
  const item = attempt.items.find((candidate) => candidate.problemId === problemId);

  if (!item) throw badInput("Энэ бодлого тухайн дадлагад байхгүй");

  return item;
};

const misconceptionPayload = (misconception: Misconception | null) =>
  misconception
    ? {
        id: misconception.id,
        kind: misconception.kind,
        title: misconception.title,
        message: misconception.message,
      }
    : null;

const lessonMomentFor = async (
  context: Context,
  topicId: string,
  misconception: Misconception | null,
) => {
  if (!misconception) return null;

  const topic = await context.models.Topics.getTopic(topicId);
  const chapter = topic.lesson?.chapters.find(
    (candidate) => candidate.misconception === misconception.id,
  );

  if (!chapter || !topic.lesson?.videoUrl) return null;

  return {
    videoUrl: topic.lesson.videoUrl,
    atSeconds: chapter.atSeconds,
    title: chapter.title,
  };
};

export const practiceResolvers = {
  Query: {
    edututorPracticeAttempt: async (
      _parent: unknown,
      { _id }: { _id: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const attemptId = parse(idSchema, _id);

      return sessionFor(context, await context.models.Attempts.getAttempt(attemptId));
    },
  },
  Mutation: {
    edututorPracticeStart: async (
      _parent: unknown,
      args: { customerId: string; topicId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(startSchema, args);
      await Promise.all([
        ensureCustomer(context, input.customerId),
        context.models.Topics.getTopic(input.topicId),
      ]);

      const approved = await context.models.Problems.listApprovedByTopic(input.topicId, 100);

      if (approved.length < PRACTICE_PROBLEM_COUNT) {
        throw badInput(
          `Дадлага эхлүүлэхийн өмнө дор хаяж ${PRACTICE_PROBLEM_COUNT} бодлого батална уу`,
        );
      }

      const weakIds = await context.models.Attempts.recentWeakProblemIds(
        input.customerId,
        input.topicId,
      );
      const selected = selectPracticeProblemIds(
        approved.map((problem) => String(problem._id)),
        weakIds,
        PRACTICE_PROBLEM_COUNT,
      );
      const attempt = await context.models.Attempts.createAttempt({
        ...input,
        items: newAttemptItems(selected),
      });

      return sessionFor(context, attempt);
    },
    edututorPracticeAnswer: async (
      _parent: unknown,
      args: { attemptId: string; problemId: string; answer: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(answerSchema, args);
      const attempt = await context.models.Attempts.getAttempt(input.attemptId);
      attemptItem(attempt, input.problemId);

      const problem = await context.models.Problems.getProblem(input.problemId);

      if (problem.topicId !== attempt.topicId) {
        throw badInput("Бодлого болон дадлагын сэдэв таарахгүй байна");
      }

      const correct = isCorrect(problem.kind, problem.params, input.answer);
      const misconception = correct ? null : diagnose(problem.kind, problem.params, input.answer);
      const saved = await context.models.Attempts.recordAnswer({
        ...input,
        correct,
        misconception: misconception?.id,
      });

      return {
        correct,
        misconception: misconceptionPayload(misconception),
        lessonMoment: correct
          ? null
          : await lessonMomentFor(context, attempt.topicId, misconception),
        session: await sessionFor(context, saved),
      };
    },
    edututorPracticeHint: async (
      _parent: unknown,
      args: { attemptId: string; problemId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const input = parse(itemSchema, args);
      const attempt = await context.models.Attempts.getAttempt(input.attemptId);
      attemptItem(attempt, input.problemId);

      const problem = await context.models.Problems.getProblem(input.problemId);
      const saved = await context.models.Attempts.takeHint(input.attemptId, input.problemId);
      const item = saved.items.find((candidate) => candidate.problemId === input.problemId);
      const level = item?.hintsUsed ?? 0;
      const hint = problem.hints[level - 1];

      if (!hint) throw badInput("Сэжүүр олдсонгүй");

      return {
        level,
        hint,
        remaining: Math.max(0, problem.hints.length - level),
        session: await sessionFor(context, saved),
      };
    },
    edututorPracticeFinish: async (
      _parent: unknown,
      { attemptId }: { attemptId: string },
      context: Context,
    ) => {
      await authorize(context, PRACTICE_MANAGE);
      const id = parse(idSchema, attemptId);
      const attempt = await context.models.Attempts.finishAttempt(id);
      const summary = calculatePracticeSummary(attempt.items);

      return {
        session: await sessionFor(context, attempt),
        correctCount: summary.correctCount,
        total: summary.total,
        mastery: summary.mastery,
      };
    },
  },
};
